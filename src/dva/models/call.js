import { loginMobilePwd, openidIsExits, auth } from '../../network/api';
import { navigate } from '../../routers/RootNavigation';
import { isPhoneAvailable } from '../../utils';
import { getItem, setItem } from '../../utils/storage';
import Socket from 'socket.io-client';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from 'react-native-webrtc';

const initState = {
  socketActive: false,
  calling: false,
  localStream: { toURL: () => null },
  remoteStream: { toURL: () => null },
  socket: Socket('ws://192.168.2.201:4000'),
  callToUsername: '',
  yourConn: new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
      {
        urls: 'stun:stun1.l.google.com:19302',
      },
      {
        urls: 'stun:stun2.l.google.com:19302',
      },
    ],
  }),
};
export default {
  namespace: 'call',
  state: initState,
  reducers: {
    changeUserId(state, { payload }) {
      return {
        ...state,
        userId: payload,
      };
    },
    setSocketActive(state, { payload }) {
      return {
        ...state,
        socketActive: payload,
      };
    },
    setCallToUsername(state, { payload }) {
      return {
        ...state,
        callToUsername: payload,
      };
    },
    setCalling(state, { payload }) {
      return {
        ...state,
        calling: payload,
      };
    },
    setLocalStream(state, { payload }) {
      return {
        ...state,
        localStream: payload,
      };
    },
    setRemoteStream(state, { payload }) {
      return {
        ...state,
        remoteStream: payload,
      };
    },
  },
  effects: {
    *getMedia({ payload }, { call, put, select }) {
      const yourConn = yield select((state) => state.call.yourConn);
      const socket = yield select((state) => state.call.yourConn);
      let isFront = false;
      const sourceInfos = yield call(mediaDevices.enumerateDevices);
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
      const stream = yield call(mediaDevices.getUserMedia, {
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
      });
      yield put({ type: 'setLocalStream', payload: stream });
      yourConn.addStream(stream);
      yourConn.onaddstream = (event) => {
        console.log('On Add Stream', event);
        dvaStore.dispatch({
          type: 'call/setRemoteStream',
          payload: event.stream,
        });
      };
      yourConn.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', event.candidate);
        }
      };
    },
    *handleCandidate({ payload }, { call, put, select }) {
      yield put({
        type: 'setCalling',
        payload: false,
      });
      const yourConn = yield select((state) => state.call.yourConn);
      console.log('Candidate ----------------->', payload);
      yourConn.addIceCandidate(new RTCIceCandidate(payload));
    },
    *handleAnswer({ payload }, { call, put, select }) {
      yield put({
        type: 'setCalling',
        payload: false,
      });
      const yourConn = yield select((state) => state.call.yourConn);
      yourConn.setRemoteDescription(new RTCSessionDescription(payload));
    },

    *handleOffer({ payload }, { call, put, select }) {
      const { name, offer } = payload;
      const yourConn = yield select((state) => state.call.yourConn);
      try {
        yield call(
          yourConn.setRemoteDescription,
          new RTCSessionDescription(offer)
        );

        const answer = yield call(yourConn.createAnswer);
        // alert("give you answer");
        yield call(yourConn.setLocalDescription, answer);
        socket.emit('answer', name, answer);
      } catch (err) {
        console.log('Offerr Error', err);
      }
    },
    *callSomeOne({ payload }, { call, put, select }) {
      const { yourConn, callToUsername } = yield select((state) => state.call);
      yield put({
        type: 'setCalling',
        payload: true,
      });
      // create an offer
      debugger;
      const localDescription = yield call(yourConn.createOffer);
      debugger;
      yield call(yourConn.setLocalDescription, localDescription);
      debugger;
      socket.emit(
        'join-room',
        userId,
        callToUsername,
        yourConn.localDescription
      );
    },
    *handleLeave({ payload }, { call, put, select }) {
      const yourConn = yield select((state) => state.call.yourConn);
      yield put({
        type: 'setRemoteStream',
        payload: { toURL: () => null },
      });
      yourConn.close();
      yourConn.onicecandidate = null;
      yourConn.onaddstream = null;
    },
  },
};
