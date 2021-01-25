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
  showSheet: false,
  localStream: { toURL: () => null },
  socket: Socket('ws://192.168.2.201:4000'),
  callToUsername: '',
  roomID: '',
  remoteList: {},
  roomList: [],
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
    changeRemoteList(state, { payload }) {
      return {
        ...state,
        remoteList: payload,
      };
    },
    changeRoomList(state, { payload }) {
      return {
        ...state,
        roomList: payload,
      };
    },
    setSocketActive(state, { payload }) {
      return {
        ...state,
        socketActive: payload,
      };
    },
    setShowSheet(state, { payload }) {
      return {
        ...state,
        showSheet: payload,
      };
    },
    setRoomID(state, { payload }) {
      return {
        ...state,
        roomID: payload,
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
      const socket = yield select((state) => state.call.socket);
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
      debugger;
      yield put({ type: 'setLocalStream', payload: stream });
    },
    *handleCandidate({ payload }, { call, put, select }) {
      yield put({
        type: 'setCalling',
        payload: false,
      });
      debugger;
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
      const { name, remoteOfferDescription } = payload;
      const yourConn = yield select((state) => state.call.yourConn);
      const socket = yield select((state) => state.call.socket);
      debugger;
      try {
        yield call(
          [yourConn, yourConn.setRemoteDescription],
          new RTCSessionDescription(remoteOfferDescription)
        );
        debugger;
        const answer = yield call([yourConn, yourConn.createAnswer]);
        debugger;
        // alert("give you answer");
        yield call([yourConn, yourConn.setLocalDescription], answer);
        debugger;
        socket.emit('answer', name, answer);
      } catch (err) {
        console.log('Offerr Error', err);
      }
    },
    *callSomeOne({ payload }, { call, put, select }) {
      const { yourConn, callToUsername } = yield select((state) => state.call);
      const socket = yield select((state) => state.call.socket);
      const userId = yield select((state) => state.user.userId);
      yield put({
        type: 'setCalling',
        payload: true,
      });
      // create an offer
      debugger;
      const localDescription = yield call([yourConn, yourConn.createOffer]);
      debugger;
      yield call([yourConn, yourConn.setLocalDescription], localDescription);
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
