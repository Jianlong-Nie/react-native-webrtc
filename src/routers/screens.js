import CallScreen from '../screens/CallScreen';
import LoginScreen from '../screens/LoginScreen';

const allScreens =  [
    
    {
      name: "CallScreen",
      component: CallScreen,
      options:{headerShown:false}
    },
    {
      name: "LoginScreen",
      component: LoginScreen,
      options:{headerShown:true}
    }
  ];

  export default allScreens;