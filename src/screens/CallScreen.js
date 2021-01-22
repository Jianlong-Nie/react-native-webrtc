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
  mediaDevices,
} from 'react-native-webrtc';
import { useNavigation } from '@react-navigation/native';

function CallScreen({
  dispatch,
  userId,
  socketActive,
  calling,
  localStream,
  remoteStream,
  socket,
  yourConn,
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
      if (localStream) socket.emit('broadcaster', userId);
      socket.on('candidate', (candidate) => {
        dispatch({ type: 'call/handleCandidate', payload: candidate });
        console.log('Candidate');
      });
      socket.on('login', (id, remoteOfferDescription) => {
        console.log('Login');
      });
      socket.on('offer', (name, remoteOfferDescription) => {
        //alert("receive,offer");
        dispatch({
          type: 'call/handleOffer',
          payload: { name, remoteOfferDescription },
        });
      });
      socket.on('answer', (id, remoteOfferDescription) => {
        dispatch({
          type: 'call/handleAnswer',
          payload: remoteOfferDescription,
        });
        console.log('Answer');
      });
      socket.on('user-not-in', (id) => {
        alert('The user you invited is not logged in');
      });
      socket.on('disconnectPeer', (id) => {
        dispatch({
          type: 'call/handleLeave',
          payload: {},
        });
        console.log('Leave');
      });
    });
    return () => {
      if (socket.connected) socket.close(); // close the socket if the view is unmounted
    };
  }, []);

  useEffect(() => {
    dispatch({ type: 'call/getMedia' });
  }, []);
  console.log('remoteStream:' + remoteStream.toURL());
  console.log('localStream:' + localStream.toURL());
  return (
    <View style={styles.root}>
      <View style={styles.inputField}>
        <TextInput
          label="Enter Friends Id"
          mode="outlined"
          style={{ marginBottom: 7 }}
          onChangeText={(text) =>
            dispatch({ type: 'call/setCallToUsername', payload: text })
          }
        />
        <Button
          mode="contained"
          onPress={() => dispatch({ type: 'call/callSomeOne', payload: {} })}
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
const mapStateToProps = ({
  user: { userId },
  call: { socketActive, calling, localStream, remoteStream, socket, yourConn },
}) => ({
  userId,
  socketActive,
  calling,
  localStream,
  remoteStream,
  socket,
  yourConn,
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
