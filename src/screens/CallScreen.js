import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Button } from 'react-native-paper';
import { TextInput } from 'react-native-paper';
import Socket from 'socket.io-client';
import InCallManager from 'react-native-incall-manager';
import { connect } from 'react-redux';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from 'react-native-webrtc';
import { useNavigation } from '@react-navigation/native';

function CallScreen({ userId }) {
  const navigation = useNavigation();
  let connectedUser;
  const [socketActive, setSocketActive] = useState(false);
  const [calling, setCalling] = useState(false);
  const [localStream, setLocalStream] = useState({ toURL: () => null });
  const [remoteStream, setRemoteStream] = useState({ toURL: () => null });
  const [socket] = useState(Socket('ws://192.168.2.201:4000'));
  const [friends, setFriends] = useState([]);
  const [me, setMe] = useState(null);

  const [callToUsername, setCallToUsername] = useState(null);
  useEffect(() => {
    navigation.setOptions({
      title: 'Your ID - ' + userId,
      headerRight: () => (
        <Button
          mode="text"
          onPress={() => {
            navigation.push('LoginScreen');
          }}
          style={{ paddingRight: 10 }}
        >
          Logout
        </Button>
      ),
    });
  }, []);

  /**
   * Calling Stuff
   */

  useEffect(() => {
    if (socketActive) {
      try {
        InCallManager.start({ media: 'audio' });
        InCallManager.setForceSpeakerphoneOn(true);
        InCallManager.setSpeakerphoneOn(true);
      } catch (err) {
        console.log('InApp Caller ---------------------->', err);
      }
      console.log(InCallManager);
      socket.emit('login', userId);
    }
  }, [socketActive]);
  function join(roomId, displayName, callback) {
    socket.emit('join-server', { roomId, displayName }, function (friendsList) {
      friends = friendsList;
      console.log('Joins', friends);
      friends.forEach((friend) => {
        createPeerConnection(friend, true);
      });
      if (callback !== null) {
        me = {
          socketId: socket.id,
          displayName: displayName,
        };
        callback();
      }
    });
  }
  function createPeerConnection(friend, isOffer) {
    let socketId = friend.socketId;
    let retVal = new RTCPeerConnection(configuration);

    peerConnections[socketId] = retVal;

    retVal.onicecandidate = function (event) {
      console.log('onicecandidate', event);
      if (event.candidate) {
        socket.emit('exchange-server', {
          to: socketId,
          candidate: event.candidate,
        });
      }
    };

    function createOffer() {
      retVal.createOffer(function (desc) {
        console.log('createOffer', desc);
        retVal.setLocalDescription(
          desc,
          function () {
            console.log('setLocalDescription', retVal.localDescription);
            socket.emit('exchange-server', {
              to: socketId,
              sdp: retVal.localDescription,
            });
          },
          logError
        );
      }, logError);
    }

    retVal.onnegotiationneeded = function () {
      console.log('onnegotiationneeded');
      if (isOffer) {
        createOffer();
      }
    };

    retVal.oniceconnectionstatechange = function (event) {
      console.log('oniceconnectionstatechange', event);
      if (event.target.iceConnectionState === 'connected' && isOffer) {
        createDataChannel(isOffer, null);
      }
    };

    retVal.onsignalingstatechange = function (event) {
      console.log('onsignalingstatechange', event);
    };

    retVal.onaddstream = function (event) {
      console.log('onaddstream', event);
      if (window.onFriendCallback !== null) {
        window.onFriendCallback(socketId, event.stream);
      }
    };

    retVal.ondatachannel = function (event) {
      console.log('ondatachannel', event);
      createDataChannel(isOffer, event);
    };

    retVal.addStream(localStream);

    function createDataChannel(isOffer, _event) {
      if (retVal.textDataChannel) {
        return;
      }
      var dataChannel = null;
      if (isOffer) {
        dataChannel = retVal.createDataChannel('text');
      } else {
        dataChannel = _event.channel;
      }

      dataChannel.onerror = function (error) {
        console.log('dataChannel.onerror', error);
      };

      dataChannel.onmessage = function (event) {
        console.log('dataChannel.onmessage:', event.data);
        if (window.onDataChannelMessage !== null) {
          window.onDataChannelMessage(JSON.parse(event.data));
        }
      };

      dataChannel.onopen = function () {
        console.log('dataChannel.onopen');
      };

      dataChannel.onclose = function () {
        console.log('dataChannel.onclose');
      };

      retVal.textDataChannel = dataChannel;
    }

    return retVal;
  }

  function exchange(data) {
    let fromId = data.from;
    let pc;
    if (fromId in peerConnections) {
      pc = peerConnections[fromId];
    } else {
      let friend = friends.filter((friend) => friend.socketId == fromId)[0];
      if (friend === null) {
        friend = {
          socketId: fromId,
          displayName: '',
        };
      }
      pc = createPeerConnection(friend, false);
    }

    if (data.sdp) {
      console.log('exchange sdp', data);
      pc.setRemoteDescription(
        new RTCSessionDescription(data.sdp),
        function () {
          if (pc.remoteDescription.type == 'offer')
            pc.createAnswer(function (desc) {
              console.log('createAnswer', desc);
              pc.setLocalDescription(
                desc,
                function () {
                  console.log('setLocalDescription', pc.localDescription);
                  socket.emit('exchange-server', {
                    to: fromId,
                    sdp: pc.localDescription,
                  });
                },
                logError
              );
            }, logError);
        },
        logError
      );
    } else {
      console.log('exchange candidate', data);
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }
  function getRoomList(callback) {
    socket.emit('list-server', {}, (data) => {
      console.log('Get list: ', data);
      callback(data);
    });
  }

  function countFriends(roomId, callback) {
    socket.emit('count-server', roomId, (count) => {
      console.log('Count friends result: ', count);
      callback(count);
    });
  }
  function leave(socketId) {
    console.log('leave', socketId);
    if (peerConnections.hasOwnProperty(socketId)) {
      let pc = peerConnections[socketId];
      pc.close();
      delete peerConnections[socketId];

      if (window.onFriendLeft) {
        window.onFriendLeft(socketId);
      }
    }
  }
  useEffect(() => {
    socket.on('connect', (data) => {
      setSocketActive(true);
      // getRoomList((data) => {});
      socket.on('exchange-client', function (data) {
        exchange(data);
      });

      socket.on('leave-client', function (participant) {
        leave(participant.socketId);
      });

      socket.on('join-client', function (friend) {
        //new friend:
        friends.push(friend);
        console.log('New friend joint conversation: ', friend);
      });

      socket.on('newroom-client', function (room) {
        console.log('New room: ', room);
        //@nhancv TODO: do with new room
      });
    });
    return () => {
      if (socket.connected) socket.close(); // close the socket if the view is unmounted
    };
  }, []);

  useEffect(() => {
    let isFront = false;
    mediaDevices.enumerateDevices().then((sourceInfos) => {
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
            optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
          },
        })
        .then((stream) => {
          // Got stream!
          setLocalStream(stream);
          // setup stream listening
          // yourConn.addStream(stream);
        })
        .catch((error) => {
          // Log error
        });
    });
  }, []);

  const onCall = async () => {
    setCalling(true);
    join('myroom', 'myroomname', (data) => {
      debugger;
    });
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
  const handleAnswer = (answer) => {
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
    setRemoteStream({ toURL: () => null });
    yourConn.close();
    yourConn.onicecandidate = null;
    yourConn.onaddstream = null;
  };
  /**
   * Calling Stuff Ends
   */
  console.log('remoteStream:' + remoteStream.toURL());
  console.log('localStream:' + localStream.toURL());
  return (
    <View style={styles.root}>
      <View style={styles.inputField}>
        <TextInput
          label="Enter Friends Id"
          mode="outlined"
          style={{ marginBottom: 7 }}
          onChangeText={(text) => setCallToUsername(text)}
        />
        <Button
          mode="contained"
          onPress={onCall}
          loading={calling}
          //   style={styles.btn}
          contentStyle={styles.btnContent}
          disabled={!(socketActive && userId.length > 0)}
        >
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
const mapStateToProps = ({ user: { userId } }) => ({
  userId,
});

export default connect(mapStateToProps)(CallScreen);

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
