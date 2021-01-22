import { registerRootComponent } from 'expo';
import App from './App';
import dva from './src/dva';
import { navigato,isCN,showToast,successToast,failToast,loadingToast,hideToast,getWindow,goBack } from './src/utils';

global.navigate = navigato;
global.goBack = goBack;
global.getWindow = getWindow;
global.successToast = successToast;
global.failToast= failToast;
global.isCN = isCN;
global.loadingToast=loadingToast;
global.hideToast= hideToast;
global.showToast= showToast;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in the Expo client or in a native build,
// the environment is set up appropriately
registerRootComponent(()=>dva());
