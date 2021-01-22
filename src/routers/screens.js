import CallScreen from '../screens/CallScreen';
import LoginScreen from '../screens/LoginScreen';

const allScreens =  [
    
    {
      name: "CallScreen",
      component: CallScreen,
      options:{ headerShown: true}
    },
    {
      name: "LoginScreen",
      component: LoginScreen,
      options:{headerShown:false}
    }
  ];

  export default allScreens;