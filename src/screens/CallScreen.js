import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
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
let myStream = {};
function CallScreen({
  dispatch,
  userId,
  socketActive,
  calling,
  localStream,
  socket,
  roomID,
  roomList,
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
    let timer = null;
    socket.on('connect', () => {
      dispatch({ type: 'call/setSocketActive', payload: true });
      timer = setInterval(() => {
        socket.emit('list-server', {}, (data) => {
          console.log('====================================');
          const entries = Object.entries(data);
          console.log('====================================');
          dispatch({ type: 'call/changeRoomList', payload: entries });
        });
      }, 2000);

      
      socket.on('exchange', (data) => {
        exchange(data);
      });
      socket.on('leave', (socketId) => {
        leave(socketId);
      });
      socket.on('disconnect', (socketId) => {
        dispatch({ type: 'call/setSocketActive', payload: false });
        dispatch({ type: 'call/changeRoomList', payload: [] });
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      });
    });
    return () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (socket.connected) socket.close(); // close the socket if the view is unmounted
    };
  }, []);

  useEffect(() => {
    dispatch({ type: 'call/getMedia' });
  }, []);
  myStream = localStream;
  console.log('====================================');
  console.log();
  console.log('localStream====================================');
  console.log(localStream);
  const join = (roomData) => {
    let onJoin = (socketIds) => {
      for (const i in socketIds) {
        debugger;
        if (socketIds.hasOwnProperty(i)) {
          let socketId = socketIds[i];
          if (typeof socketId === 'object') {
            socketId = socketId.socketId;
          }
          console.log('====================================');
          console.log(socketId);
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
    console.log('localStream===============================');
    console.log(localStream);
    console.log('====================================');
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

    peer.addStream(myStream);
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
    debugger;
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

    // delete pcPeers[socketId];
    const remoteList = remoteList;
    // delete remoteList[socketId];
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
      pc.getStats(track, callbackdff);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.inputField}>
        <TextInput
          label="Enter ROOM Id"
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
          CREATE A ROOM
        </Button>
      </View>

      <FlatList
        data={roomList}
        renderItem={({ item }) => {
          if (!item[0]) {
            return null;
          }
          console.log('====================================');
          console.log(item[1]);
          console.log('====================================');
          return (
            <View style={styles.renderitem}>
              <View
                style={{
                  marginLeft: 15,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 10,
                }}
              >
                <Text>roomID:</Text>
                <Text style={styles.nutrition}>{item[0]}</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    marginLeft: 15,
                    alignItems: 'center',
                  }}
                >
                  <Text>founder:</Text>
                  <Text style={styles.nutrition}>{item[1]['name']}</Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    marginLeft: 15,
                    alignItems: 'center',
                  }}
                >
                  <Text>Current online:</Text>
                  <Text style={styles.nutrition}>
                    {item[1]['participant'].length}
                  </Text>
                </View>
                <Button
                  mode="contained"
                  onPress={() => {
                    debugger;
                    join({ roomID: item[0], displayName: userId });
                    // dispatch({ type: 'call/callSomeOne', payload: {} })
                  }}
                  loading={calling}
                  style={{ marginRight: 10, marginBottom: 10 }}
                  contentStyle={{ fontSize: 15 }}
                  disabled={!(socketActive && userId.length > 0)}
                >
                  JOIN
                </Button>
              </View>
            </View>
          );
        }}
        keyExtractor={({ item }, index) => `list${index}`}
      />
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
    roomList,
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
  roomList,
});

export default connect(mapStateToProps)(CallScreen);

const styles = StyleSheet.create({
  renderitem: {
    backgroundColor: 'white',
    width: '100%',
    height: 70,
    flexDirection: 'column',
    justifyContent: 'center',
    marginTop: 15,
    borderRadius: 16,
    borderColor: 'lightgray',
    borderWidth: 1,
  },
  value: { fontSize: 20 },
  nutrition: {
    fontSize: 18,
    color: '#3BC054',
  },
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
