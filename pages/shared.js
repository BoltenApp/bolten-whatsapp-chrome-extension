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
    notifyTab(
      {
        type: "CookieSetRequested",
        data: {
          userToken: userToken,
          clientUserId: clientUserId
        }
      },
      enableAlreadyLoggedInPage,
      enableWhatsAppNotOpened
    );
  }
}

export async function unsetCookiesAndDisplayLoginPage() {
  setCookie("UserKey", '', 7);
  setCookie("ClientUserId", '', 7);
  notifyTab(
    {
      type: "CookieSetRequested",
      data: {
        userToken: '',
        clientUserId: ''
      }
    },
    enableLoginPage,
    enableLoginPage
  );
}
