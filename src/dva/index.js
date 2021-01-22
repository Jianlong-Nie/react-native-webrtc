import React from 'react';
import { create } from 'dva-core';
import { Provider } from 'react-redux';
import { createLogger } from 'redux-logger';
import App from '../../App';
import UserModel from './models/user';
import AppModel from './models/app';

const options = {
    initialState: {},
    // 加载model
    models: [
      UserModel,
      AppModel
    ],
    onAction: [
      createLogger(),
    ],
    onError(e) {
      console.log('====================================');
      console.log(e);
      console.log('====================================');
    },
  };
  
const dva = () => {
  const app = create(options);
  // register models
  options.models.forEach(model => app.model(model));

  app.start();
  // eslint-disable-next-line no-underscore-dangle
  const store = app._store;
  app.getStore = () => store;
  //   // 把store挂到global上
   global.dvaStore = store;
  // 外面传进来的组件作为参数放到Provider组件里面
  return (
    <Provider store={store}>
      <App></App>
    </Provider>
  );
};


export default dva;
