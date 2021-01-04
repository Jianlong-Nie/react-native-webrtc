import React, {useEffect, useState} from 'react';
import {View, StyleSheet,Alert} from 'react-native';
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
 // const [socket] = useState(Socket('ws://207.254.40.176:4000'));
  const [socket] = useState(Socket('ws://192.168.2.176:4000'));
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
      socket.on('offer', (name, remoteOfferDescription) => {
        //alert("receive,offer");
        handleOffer(name,remoteOfferDescription);
      });
      socket.on('answer', (id, remoteOfferDescription) => {
        handleAnswer(remoteOfferDescription);
        console.log('Answer');
      });
      socket.on('refuse', () => {
        setCalling(false);
        alert("The user rejects your call");
      });
      socket.on('user-not-in', () => {
        setCalling(false);
        alert("The user you invited is not logged in");
      });
      socket.on('disconnectPeer', id => {
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
          // video: {
          //   mandatory: {
          //     minWidth: 500, // Provide your own width, height and frame rate here
          //     minHeight: 300,
          //     minFrameRate: 30,
          //   },
          //   facingMode: isFront ? 'user' : 'environment',
          //   optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
          //},
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
    Alert.alert(
      'receive calling',
      (name + ' is calling you.'),
      [
        {
          text: 'decline',
          onPress: () => { socket.emit('refuse', connectedUser);},
          style: 'cancel'
        },
        {
          text: 'Accept',
          onPress: async () => {
            
            try {
              await yourConn.setRemoteDescription(new RTCSessionDescription(offer));
              const answer = await yourConn.createAnswer();
            // alert("give you answer");
              await yourConn.setLocalDescription(answer);
              socket.emit('answer', connectedUser, answer);
              
            } catch (err) {
              console.log('Offerr Error', err);
            }
          }
        },
        
      
      ],
      { cancelable: false }
    );
    
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
         
          <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />
        </View>
        <View style={[styles.videos, styles.remoteVideos]}>
          
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
    justifyContent:'center'
  },
  inputField: {
    marginBottom: 10,
    flexDirection: 'column',
  },
  videoContainer: {
    flex: 1,
  },
  videos: {
    width: '100%',
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 6,
  },
  localVideos: {
    height: 0.5,
    marginBottom: 10,
  },
  remoteVideos: {
    height: 0.5,
  },
  localVideo: {
  
    height: 1,
    width: 1,
  },
  remoteVideo: {
    height: 1,
    width: 1,
  },
});
