import Config from '../utils/config';

const BASEURL = Config.baseUrl;

export async function customFetch(url, options, baseUrl = BASEURL) {
  const requestUrl = baseUrl + url+"?XDEBUG_SESSION_START=11073";
  const defaultOptions = {
    // credentials: 'include',
    //headers: { deviceUuid: global.deviceUuid },
  };
  
  const { token } = dvaStore.getState().user;
  !!token && (defaultOptions.headers.token = token);
  const newOptions = { ...defaultOptions, ...options };
  if (newOptions.method === 'POST' || newOptions.method === 'PUT' || newOptions.method === 'DELETE') {
    newOptions.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      ...defaultOptions.headers,
      ...newOptions.headers,
     
    };
  } else {
    newOptions.headers = {
      Accept: 'application/json',
      ...defaultOptions.headers,
      ...newOptions.headers,
      
    };
  }

  const response = await fetch(requestUrl, newOptions);

  return response;
}

export async function request(url, options, params) {
  try {
    // const connectionInfo = await NetInfo.fetch();
    // if (connectionInfo && connectionInfo.type === 'none') {
    //   Toast.show('networkError');
    //   return {};
    // }
    const response = await customFetch(url, options, params && params.baseUrl);
    let result = await response.json()  
    if ((typeof result)=="string") {
        result = JSON.parse(result);  
    }
    return result;
  } catch (e) {

    return { message: 'unknowError' };
  }
}

export function postRequst(url, body, params) {
  const headers = params ? params.headers : {};
  return request(url, { method: 'POST', body: JSON.stringify(body), headers }, params);
}

export function putJSON(url, body) {
  return request(url, { method: 'PUT', body: JSON.stringify(body) });
}

export function postForm(url, data, params) {
  const formData = new FormData();
  if (data) {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        formData.append(key, data[key]);
      }
    }
  }
  return request(url, { method: 'POST', headers: { 'Content-Type': 'multipart/form-data' }, body: formData }, params);
}

export function putForm(url, data) {
  const formData = new FormData();
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      formData.append(key, data[key]);
    }
  }
  return request(url, { method: 'PUT', headers: { 'Content-Type': 'multipart/form-data' }, body: formData });
}

export function requestNoLoading(url, options) {
  return request(url, options);
}
