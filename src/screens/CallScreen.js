import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';
import {Button} from 'react-native-paper';
import {TextInput} from 'react-native-paper';
import Socket from 'socket.io-client';
import InCallManager from 'react-native-incall-manager';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from 'react-native-webrtc';

export default function CallScreen({route,navigation, ...props}) {
  const { userId } = route.params;
  
  let connectedUser;
  const [socketActive, setSocketActive] = useState(false);
  const [calling, setCalling] = useState(false);
  const [localStream, setLocalStream] = useState({toURL: () => null});
  const [remoteStream, setRemoteStream] = useState({toURL: () => null});
  const [socket] = useState(Socket('ws://192.168.2.201:4000'));

  const [yourConn, setYourConn] = useState(
    //change the config as you need
  new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',  
        }, {
          urls: 'stun:stun1.l.google.com:19302',    
        }, {
          urls: 'stun:stun2.l.google.com:19302',    
        }

      ],
    }),
  );

  const [offer, setOffer] = useState(null);
  const [callToUsername, setCallToUsername] = useState(null);
  useEffect(() => {
    navigation.setOptions({
      title: 'Your ID - ' + userId,
      headerRight: () => (
        <Button mode="text" onPress={()=>{ navigation.push('Login'); }} style={{paddingRight: 10}}>
          Logout
        </Button>
      ),
    });
  }, [userId]);

  /**
   * Calling Stuff
   */

  useEffect(() => {
    if (socketActive && userId.length > 0) {
      try {
        InCallManager.start({media: 'audio'});
        InCallManager.setForceSpeakerphoneOn(true);
        InCallManager.setSpeakerphoneOn(true);
      } catch (err) {
        console.log('InApp Caller ---------------------->', err);
      }
      console.log(InCallManager);
      socket.emit('login', userId);

    }
  }, [socketActive, userId]);

  useEffect(() => {
    socket.on('connect', () => {
      setSocketActive(true);
      if (localStream) socket.emit('broadcaster',userId);
      socket.on('candidate', (candidate) => {
        handleCandidate(candidate);
        console.log('Candidate');
      });
      socket.on('login', (id, remoteOfferDescription) => {
        console.log('Login');
      });
      // socket.on('userexits', (id, message) => {
      //   if (socket.connected) socket.close(); 
      //   alert("The current user already exists");
      //   try {
      //     navigation.goBack();
      //   } catch (error) {
          
      //   }
        
      // });
      socket.on('offer', (name, remoteOfferDescription) => {
        //alert("receive,offer");
        handleOffer(name,remoteOfferDescription);
      });
      socket.on('answer', (id, remoteOfferDescription) => {
        handleAnswer(remoteOfferDescription);
        console.log('Answer');
      });
      socket.on('user-not-in', id => {
        alert("The user you invited is not logged in");
      });
      socket.on('disconnectPeer', id => {
        // peerConnections.current.get(id).close();
        // peerConnections.current.delete(id);
        handleLeave();
        console.log('Leave');
      });
    });
    return () => {
      if (socket.connected) socket.close(); // close the socket if the view is unmounted
    };
  }, []);

  useEffect(() => {
    let isFront = false;
    mediaDevices.enumerateDevices().then(sourceInfos => {
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
          sourceInfo.kind == 'videoinput' &&
          sourceInfo.facing == (isFront ? 'front' : 'environment')
        ) {
          videoSourceId = sourceInfo.deviceId;
        }
      }
      mediaDevices
        .getUserMedia({
          audio: true,
          video: {
            mandatory: {
              minWidth: 500, // Provide your own width, height and frame rate here
              minHeight: 300,
              minFrameRate: 30,
            },
            facingMode: isFront ? 'user' : 'environment',
            optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
          },
        })
        .then(stream => {
          // Got stream!
          setLocalStream(stream);
          // setup stream listening
          yourConn.addStream(stream);
        })
        .catch(error => {
          // Log error
        });
    });

    yourConn.onaddstream = event => {
      console.log('On Add Stream', event);
      setRemoteStream(event.stream);
    };

    // // Setup ice handling
    yourConn.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate);
      }
    };
  }, []);

  const send = (message) => {
    //attach the other peer username to our messages
    if (connectedUser) {
      message.name = connectedUser;
      console.log('Connected iser in end----------', message);
    }
   // alert(message.type);
    socket.emit(message.type, message);
   // conn.send(JSON.stringify(message));
  };

  const onCall = async () => {
    setCalling(true);
    connectedUser = callToUsername;
    // create an offer
    const localDescription = await yourConn.createOffer();
    await yourConn.setLocalDescription(localDescription);
    debugger
    socket.emit('join-room',userId, callToUsername, yourConn.localDescription);
  };

  //when somebody sends us an offer
  const handleOffer = async (name, offer) => {
    console.log(name + ' is calling you.');
    connectedUser = name;
    try {
      await yourConn.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await yourConn.createAnswer();
     // alert("give you answer");
      await yourConn.setLocalDescription(answer);
      socket.emit('answer', connectedUser, answer);
      
    } catch (err) {
      console.log('Offerr Error', err);
    }
  };

  //when we got an answer from a remote user
  const handleAnswer = answer => {
    //alert("tell you:received");
    setCalling(false);
    yourConn.setRemoteDescription(new RTCSessionDescription(answer));
  };

  //when we got an ice candidate from a remote user
  const handleCandidate = (candidate) => {
    setCalling(false);
    console.log('Candidate ----------------->', candidate);
    yourConn.addIceCandidate(new RTCIceCandidate(candidate));
    
  };
  
  const handleLeave = () => {
    connectedUser = null;
    setRemoteStream({toURL: () => null});
    yourConn.close();
    yourConn.onicecandidate = null;
    yourConn.onaddstream = null;
  };
  /**
   * Calling Stuff Ends
   */
  console.log("remoteStream:"+remoteStream.toURL());
  console.log("localStream:"+localStream.toURL());
  return (
    <View style={styles.root}>
      <View style={styles.inputField}>
        <TextInput
          label="Enter Friends Id"
          mode="outlined"
          style={{marginBottom: 7}}
          onChangeText={text => setCallToUsername(text)}
        />
        <Button
          mode="contained"
          onPress={onCall}
          loading={calling}
          //   style={styles.btn}
          contentStyle={styles.btnContent}
          disabled={!(socketActive && userId.length > 0)}>
          Call
        </Button>
      </View>

      <View style={styles.videoContainer}>
        <View style={[styles.videos, styles.localVideos]}>
          <Text>Your Video</Text>
          <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />
        </View>
        <View style={[styles.videos, styles.remoteVideos]}>
          <Text>Friends Video</Text>
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    flex: 1,
    padding: 20,
  },
  inputField: {
    marginBottom: 10,
    flexDirection: 'column',
  },
  videoContainer: {
    flex: 1,
    minHeight: 450,
  },
  videos: {
    width: '100%',
    flex: 1,
    position: 'relative',
    overflow: 'hidden',

    borderRadius: 6,
  },
  localVideos: {
    height: 100,
    marginBottom: 10,
  },
  remoteVideos: {
    height: 400,
  },
  localVideo: {
    backgroundColor: '#f2f2f2',
    height: '100%',
    width: '100%',
  },
  remoteVideo: {
    backgroundColor: '#f2f2f2',
    height: '100%',
    width: '100%',
  },
});