import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
// import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
// import Ionicons from 'react-native-vector-icons/Ionicons';
import {navigationRef} from './RootNavigation';
import allScreens from './screens';
const StackNavigator = createStackNavigator();
// const TabNavigator = createBottomTabNavigator();

export function getStackNavigator(initialRouteName) {
  return (
    <StackNavigator.Navigator
      initialRouteName={initialRouteName}
     
      >
      {allScreens.map(({name, component, options}) => (
        <StackNavigator.Screen
          name={name}
          key={name}
          component={component}
          options={options}
        />
      ))}
    </StackNavigator.Navigator>
  );
}
export  function UnAuthRouter() {
  return (
    <NavigationContainer ref={navigationRef}>
    {
      getStackNavigator('LoginScreen')
    }
    </NavigationContainer>
  );
}
// export default function Router() {
//   const homeScreen = () => getStackNavigator('HomeScreen');
//   return (
//     <NavigationContainer ref={navigationRef}>
//       <TabNavigator.Navigator
//         screenOptions={({route}) => ({
//           tabBarIcon: ({focused, color, size}) => {
//             let iconName;

//             if (route.name === 'Home') {
//               iconName = focused ? 'ios-home' : 'ios-home-outline';
//             } else if (route.name === 'Matching') {
//               iconName = focused ? 'ios-heart-half' : 'ios-heart-half-outline';
//             } else if (route.name === 'Setting') {
//               iconName = focused ? 'ios-settings' : 'ios-settings-outline';
//             }
//             return <Ionicons name={iconName} size={size} color={color} />;
//           },
//         })}
//         tabBarOptions={{
//           activeTintColor: '#9605ff',
//           inactiveTintColor: 'gray',
//           keyboardHidesTabBar: true,
//         }}>
//         <TabNavigator.Screen name="Home" component={homeScreen} />
//       </TabNavigator.Navigator>
//     </NavigationContainer>
//   );
// }
