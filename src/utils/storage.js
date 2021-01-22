import AsyncStorage from '@react-native-community/async-storage';


export const setItem = async (keys, value) => {
  try {
    await AsyncStorage.setItem(keys,value);
  } catch (e) {
    // saving error
  }
  
};
export const getItem = async (keys) => {
  try {
    return await AsyncStorage.getItem(keys)
  } catch(e) {
    // read error
  }
};
export const removeItem = async (keys) => {
  try {
    await AsyncStorage.removeItem(keys)
  } catch(e) {
    // remove error
  }
};
// !!!!使用 setItem和getItem 的时候 必须包含在一个 async 函数里面。!!!

