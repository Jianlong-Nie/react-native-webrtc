import 'react-native-gesture-handler';
import React from 'react';
import Router from './src/routers/router';
import { connect } from 'react-redux';
import { Provider } from '@ant-design/react-native';
import {UnAuthRouter} from './src/routers/router';
import { getItem } from './src/utils/storage';
// require('react-native').unstable_enableLogBox()


export const AppStateContext = React.createContext();

const AppStateProvider = props => {
  return (
    <AppStateContext.Provider>
      {props.children}
    </AppStateContext.Provider>
  );
};

const App: () => React$Node =  ({ token,dispatch }) => {
  dispatch({type:'user/autoLogin'});
  return (
   <Provider>
      <AppStateProvider>
          <UnAuthRouter/>
      </AppStateProvider>
    </Provider> 
  );
}
const mapStateToProps = ({
  user:{token}
}) => ({
  token
});
export default connect(mapStateToProps)(App);