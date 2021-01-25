import { navigate } from '../../routers/RootNavigation';
import { isPhoneAvailable } from '../../utils';
import { getItem, setItem } from '../../utils/storage';

const initState = {
  userId: '',
};
export default {
  namespace: 'user',
  state: initState,
  reducers: {
    changeUserId(state, { payload }) {
      return {
        ...state,
        userId: payload,
      };
    },
  },
  effects: {
    *login({ payload }, { call, put, select }) {
      const userId = yield select((state) => state.user.userId);
      yield call(setItem, 'userid', userId);
      navigate('CallScreen');
    },
    *autoLogin({ payload }, { call, put, select }) {
      const userId = yield call(getItem, 'userid');
      //如果用户第三方登录过，则优先用三方登录的方式
      if (userId) {
        yield put({
          type: 'changeUserId',
          payload: userId,
        });
        navigate('CallScreen');
      }
    },
  },
};
