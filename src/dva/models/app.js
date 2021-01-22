

const initState = {
    loading: false,
};
export default {
  namespace: 'app',
  state: initState,
  reducers: {
    showLoading(state) {
        return { ...state, loading: true };
    },
    hideLoading(state) {
        return { ...state, loading: false };
    },
  },
  effects: {
    
    
  },
};
