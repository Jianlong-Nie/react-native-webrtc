import {loginMobilePwd, openidIsExits, auth} from '../../network/api';
import {isPhoneAvailable} from '../../utils';
import {getItem, setItem} from '../../utils/storage';

const initState = {
  currentUser: undefined,
  token: '',
  fbtoken: '',
  fbuserId: '',
};
export default {
  namespace: 'user',
  state: initState,
  reducers: {
    loginSuccess(state, {payload}) {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: {
    *login({payload}, {call, put, select}) {
      const register = yield select((state) => state.register);
      const {phone, password} = register;
      if (!isPhoneAvailable(phone)) {
        showToast('Please enter the correct phone number first');
        return;
      } else {
        if (password.length == 0 || password == null) {
          showToast('Please set the password.');
        } else {
          const result = yield call(loginMobilePwd, phone, password);
          if (result.message == 'unknowError') {
            return;
          }
          const {code, data, message} = result;
          if (code != 0) {
            showToast(message);
            return;
          }
          const {token} = data;
          dvaStore.dispatch({type: 'user/saveMobileAndPwd'});
          yield put({type: 'loginSuccess', payload: {token}});
          yield put({
            type: 'register/changeStatus',
            payload: {
              id: '',
              img: '',
              countDown: 'Send',
              phone: '',
              password: '',
              code: '',
              key: '',
            },
          });
        }
      }
    },
    *saveMobileAndPwd({payload}, {call, put, select}) {
      const register = yield select((state) => state.register);
      const {phone, password} = register;
      yield call(setItem, 'mobile', phone);
      yield call(setItem, 'password', password);
    },
    *saveFbId({payload}, {call, put, select}) {
      const user = yield select((state) => state.user);
      const {fbuserId} = user;

      yield call(setItem, 'fbuserId', fbuserId);
    },
    *autoLogin({payload}, {call, put, select}) {
      const fbuserId = yield call(getItem, 'fbuserId');
      //如果用户第三方登录过，则优先用三方登录的方式
      if (fbuserId) {
        yield put({
          type: 'loginSuccess',
          payload: {
            fbuserId: fbuserId,
          },
        });
        dvaStore.dispatch({type: 'user/auth'});
      }
      const mobile = yield call(getItem, 'mobile');
      const password = yield call(getItem, 'password');
      if (mobile && password) {
        yield put({
          type: 'register/changeStatus',
          payload: {phone: mobile, password},
        });
        dvaStore.dispatch({type: 'user/login'});
      }
    },
    *openidIsExits({payload}, {call, put, select}) {
      const user = yield select((state) => state.user);
      const {fbtoken, fbuserId} = user;
      const result = yield call(openidIsExits, fbuserId);
      debugger;
      //如果用户绑定过，则直接第三方登录
      if (result.code >= 0 && result.data > 0) {
        dvaStore.dispatch({type: 'user/auth'});
      } else {
        navigate('BindPhone');
      }
    },
    // 第三方登录
    *auth({payload}, {call, put, select}) {
      const user = yield select((state) => state.user);
      const {fbuserId} = user;
      const authLogin = yield call(auth, {wx_openid: fbuserId});
      if (authLogin.code == 0) {
        yield call(setItem, 'fbuserId', fbuserId);
        const {
          data: {token},
        } = authLogin;
        yield put({type: 'loginSuccess', payload: {token}});
      }
    },
  },
};
