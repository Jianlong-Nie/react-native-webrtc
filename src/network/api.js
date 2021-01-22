import { request,postRequst } from './request';


export async function  getImgCaptcha(captcha_id="") {
  return postRequst('/api/captcha/captcha', {captcha_id}, { hiddenLoading: true });
}

/**
 *
 * 用户手机号注册api
 * @export
 * @param {string} {phone,password,key,code}
 * @return {*} 
 */
export async function registerWithPhone(params) {
  return postRequst('/api/register/mobile', params);
}

/**
 *
 * 获取短信验证码
 * @export
 * @param {*} mobile
 * @return {*} 
 */
export async function getSMS(mobile) {
  return postRequst('/api/register/mobileCode', {mobile});
}

/**
 *
 * 手机号密码登录
 * @export
 * @param {*} [mobile,password]
 * @return {*} 
 */
export async function loginMobilePwd(mobile,password) {
  return postRequst('/api/login/login', {mobile,password,type:"mobile"});
}
/**
 *
 * 判断openid是否已经存在
 * @export
 * @param {*} wx_openid
 * @return {*} 
 */
export async function openidIsExits(wx_openid) {
  return postRequst('/api/login/openidIsExits', {wx_openid});
}
/**
 *
 * 绑定第三方登录
 * @export
 * @param {string} {phone,wx_openid,key,code}
 * @return {*} 
 */
export async function bindAuth(params) {
  return postRequst('/api/login/bindAuth', params);
}
/**
 *
 * 第三方登录
 * @export
 * @param {string} {wx_openid}
 * @return {*} 
 */
export async function auth(params) {
  return postRequst('/api/login/auth', params);
}



