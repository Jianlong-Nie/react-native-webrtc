import {
    Platform,
    Dimensions,
  } from 'react-native';
  
const PLATFORM_OS = Platform.OS;

const { width: screenW, height: screenH } = Dimensions.get('window');
const width = Math.min(screenW, screenH);
const height = Math.max(screenW, screenH);

export default Global;
