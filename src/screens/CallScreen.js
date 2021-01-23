import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Button } from 'react-native-paper';
import { TextInput } from 'react-native-paper';
import InCallManager from 'react-native-incall-manager';
import { connect } from 'react-redux';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import { useNavigation } from '@react-navigation/native';
let pcPeers = {};
function CallScreen({
  dispatch,
  userId,
  socketActive,
  calling,
  localStream,
  socket,
  roomID,
  remoteList,
}) {
  const navigation = useNavigation();
  //change the config as you need
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

  useEffect(() => {
    socket.on('connect', () => {
      dispatch({ type: 'call/setSocketActive', payload: true });
      socket.on('exchange', (data) => {
        exchange(data);
      });
      socket.on('leave', (socketId) => {
        leave(socketId);
      });
    });
    return () => {
      if (socket.connected) socket.close(); // close the socket if the view is unmounted
    };
  }, []);

  useEffect(() => {
    dispatch({ type: 'call/getMedia' });
  }, []);
  console.log('localStream:' + localStream.toURL());
  const join = (roomData) => {
    let onJoin = (socketIds) => {
      for (const i in socketIds) {
        if (socketIds.hasOwnProperty(i)) {
          const socketId = socketIds[i];
          console.log('====================================');
          console.log('输出socketId' + socketId);
          console.log('====================================');
          createPC(socketId, true);
        }
      }
    };
    socket.emit('join', roomData, onJoin);
  };
  const createPC = (socketId, isOffer) => {
    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };
    const peer = new RTCPeerConnection(configuration);
    console.log('Peer====================================');
    console.log(peer);
    console.log('====================================');
    pcPeers = {
      ...pcPeers,
      [socketId]: peer,
    };
    peer.onnegotiationneeded = async () => {
      debugger;
      //console.log('onnegotiationneeded');
      if (isOffer) {
        const localDescription = await peer.createOffer();
        await peer.setLocalDescription(localDescription);
        socket.emit('exchange', { to: socketId, sdp: peer.localDescription });
      }
    };

    peer.addStream(localStream);
    peer.onaddstream = (event) => {
      remoteList[socketId] = event.stream.toURL();
      dispatch({ type: 'call/changeRemoteList', payload: remoteList });
    };
    peer.onicecandidate = (event) => {
      //console.log('onicecandidate', event.candidate);
      if (event.candidate) {
        socket.emit('exchange', { to: socketId, candidate: event.candidate });
      }
    };
    peer.oniceconnectionstatechange = (event) => {
      //console.log('oniceconnectionstatechange', event.target.iceConnectionState);
      if (event.target.iceConnectionState === 'completed') {
        //console.log('event.target.iceConnectionState === 'completed'');
        setTimeout(() => {
          getStats();
        }, 1000);
      }
      if (event.target.iceConnectionState === 'connected') {
        //console.log('event.target.iceConnectionState === 'connected'');
      }
    };
    peer.onsignalingstatechange = (event) => {
      //console.log('on signaling state change', event.target.signalingState);
    };
    peer.onremovestream = (event) => {
      debugger;
      //console.log('on remove stream', event.stream);
    };

    return peer;
  };

  const exchange = async (data) => {
    debugger;
    let fromId = data.from;
    if (data.sdp) {
      console.log('Exchange====================================');
      console.log(data);
      console.log('====================================');
    }
    let peer;
    if (fromId in pcPeers) {
      peer = pcPeers[fromId];
    } else {
      peer = createPC(fromId, false);
    }
    if (data.sdp) {
      await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('exchange', { to: fromId, sdp: peer.localDescription });
    } else {
      peer.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  };

  const leave = (socketId) => {
    //console.log('leave', socketId);
    const peer = pcPeers[socketId];
    peer.close();
    delete pcPeers[socketId];
    const remoteList = remoteList;
    delete remoteList[socketId];
    // appClass.setState({
    //   info: 'One peer left!',
    //   remoteList: remoteList,
    // });
  };

  const mapHash = (hash, func) => {
    //console.log(hash);
    const array = [];
    for (const key in hash) {
      if (hash.hasOwnProperty(key)) {
        const obj = hash[key];
        array.push(func(obj, key));
      }
    }
    return array;
  };

  const getStats = () => {
    const pc = pcPeers[Object.keys(pcPeers)[0]];
    if (
      pc.getRemoteStreams()[0] &&
      pc.getRemoteStreams()[0].getAudioTracks()[0]
    ) {
      const track = pc.getRemoteStreams()[0].getAudioTracks()[0];
      let callback = (report) => console.log('getStats report', report);
      //console.log('track', track);
      pc.getStats(track, callback, logError);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.inputField}>
        <TextInput
          label="Enter Friends Id"
          mode="outlined"
          style={{ marginBottom: 7 }}
          onChangeText={(text) =>
            dispatch({ type: 'call/setRoomID', payload: text })
          }
        />
        <Button
          mode="contained"
          onPress={() => {
            join({ roomID, displayName: userId });
            // dispatch({ type: 'call/callSomeOne', payload: {} })
          }}
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
          {/* <RTCView streamURL={localStream.toURL()} style={styles.localVideo} /> */}
        </View>
        <View style={[styles.videos, styles.remoteVideos]}>
          <Text>Friends Video</Text>
          {/* <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
          /> */}
        </View>
      </View>
    </View>
  );
}
const mapStateToProps = ({
  user: { userId },
  call: {
    roomID,
    remoteList,
    socketActive,
    calling,
    localStream,
    socket,
    yourConn,
  },
}) => ({
  userId,
  socketActive,
  calling,
  localStream,
  socket,
  yourConn,
  remoteList,
  roomID,
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
