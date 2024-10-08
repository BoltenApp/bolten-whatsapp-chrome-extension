import {
  enableWhatsAppNotOpened,
  enableLoginPage,
  enableAlreadyLoggedInPage,
} from './../pageHandler.js';

export function fetchCurrentContact() {
  notifyTab(
    {
      type: "CurrentContactRequested"
    },
    enableAlreadyLoggedInPage,
    enableWhatsAppNotOpened
  );
}

export async function setCookiesAndNotifyWhatsappTab(userToken, clientUserId) {
  if (userToken && clientUserId) {
    setCookie("UserKey", userToken, 7);
    setCookie("ClientUserId", clientUserId, 7);
    console.debug("Cookie set ClientUserId: ", clientUserId);
    notifyTab(
      {
        type: "CookiesSetRequested",
        data: {
          userToken: userToken,
          clientUserId: clientUserId
        }
      },
      fetchCurrentContact,
      enableWhatsAppNotOpened
    );
  }
}

export async function unsetCookiesAndDisplayLoginPage() {
  setCookie("UserKey", '', 7);
  setCookie("ClientUserId", '', 7);
  notifyTab(
    {
      type: "CookiesSetRequested",
      data: {
        userToken: '',
        clientUserId: ''
      }
    },
    enableLoginPage,
    enableLoginPage
  );
}
