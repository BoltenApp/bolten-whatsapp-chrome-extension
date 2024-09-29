import {
  enableWhatsAppNotOpened,
  enableLoginPage,
  enableAlreadyLoggedInPage,
} from './../pageHandler.js';

export async function setCookiesAndNotifyWhatsappTab(userToken, clientUserId) {
  if (userToken && clientUserId) {
    setCookie("UserKey", userToken, 7);
    setCookie("ClientUserId", clientUserId, 7);
    console.log("Cookie set ClientUserId: ", clientUserId);
    notifyTab({ userToken: userToken, clientUserId: clientUserId }, enableAlreadyLoggedInPage, enableWhatsAppNotOpened);
    // TODO: Remove this line
    // transitionToContactPage();
  }
}

export async function unsetCookiesAndDisplayLoginPage() {
  setCookie("UserKey", '', 7);
  setCookie("ClientUserId", '', 7);
  notifyTab({ userToken: '', clientUserId: '' }, enableLoginPage, enableLoginPage);
}
