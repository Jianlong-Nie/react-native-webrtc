import DeviceInfo from 'react-native-device-info';
import * as RootNavigation from '../routers/RootNavigation';
import {Dimensions, Platform, StatusBar} from 'react-native';
const X_WIDTH = 375;
const X_HEIGHT = 812;
const XSMAX_WIDTH = 414;
const XSMAX_HEIGHT = 896;
const {height, width} = Dimensions.get('window');
import ImagePicker from 'react-native-image-picker';

export function isCN() {
  const local = DeviceInfo.getDeviceLocale();
  return local.indexOf('CN') !== -1;
}

export function getDate(index) {
  var date = date || new Date(),
    timestamp,
    newDate;
  if (!(date instanceof Date)) {
    date = new Date(date.replace(/-/g, '/'));
  }
  timestamp = date.getTime();
  newDate = new Date(timestamp + index * 24 * 3600 * 1000);
  var month = newDate.getMonth() + 1;
  month = month.toString().length == 1 ? '0' + month : month;
  var day =
    newDate.getDate().toString().length == 1
      ? '0' + newDate.getDate()
      : newDate.getDate();
  return [newDate.getFullYear(), month, day].join('-');
}
// functions-file.js

export function goBack() {
  RootNavigation.goBack();
}

export function getWindow() {
  return Dimensions.get('window');
}

export const isIPhoneX = () => {
  if (Platform.OS === 'android') {
    return false;
  }
  return (
    (Platform.OS === 'ios' && width === X_WIDTH && height === X_HEIGHT) ||
    (width === XSMAX_WIDTH && height === XSMAX_HEIGHT)
  );
};
export const StatusBarHeight = Platform.select({
  ios: isIPhoneX() ? 44 : 20,
  android: StatusBar.currentHeight,
  default: 0,
});

export function navigato(route, params) {
  RootNavigation.navigate(route, params);
}
export function successToast(msg) {
  Toast.success(msg, 1);
}
export function showToast(msg) {
  Toast.info(msg, 2, undefined, false);
}
export function failToast(msg) {
  Toast.fail(msg);
}
export function offline(msg) {
  Toast.offline(msg);
}
export function loadingToast() {
  Toast.loading('Loading...', 6000000);
}
export function hideToast() {
  Toast.removeAll();
}

export function isPhoneAvailable(phone) {
  let myreg = /^(1?|(1\-)?)\d{10,12}$/;
  if (phone.length == 0 || phone == null) {
    return false;
  } else if (!myreg.test(phone)) {
    return false;
  } else {
    return true;
  }
}

export const selectPicture = (coptions) =>
  new Promise((resolve) => {
    const options = {
      title: 'Select Image',
      quality: 0.1,
      maxWidth: 600,
      maxHeight: 600,
      durationLimit: 10,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
    ImagePicker.showImagePicker(coptions ? coptions : options, (response) => {
      console.log('Response = ', response);
      if (response.didCancel) {
        failToast('User cancelled image picker');
        console.log();
      } else if (response.error) {
        failToast('ImagePicker Error: ' + response.error);
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        const source = response;
        resolve(source);
      }
    });
  });
