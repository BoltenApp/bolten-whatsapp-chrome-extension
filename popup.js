import {
  fetchClientUserId,
} from "./api.js";

import {
  enableLoginPage,
  enableAlreadyLoggedInPage,
} from './pageHandler.js';

import {
  setCookiesAndNotifyWhatsappTab,
} from './pages/shared.js';

import {
  loginToWhatsappWeb,
  logoutFromWhatsappWeb
} from './pages/login.js';

import {
  transitionToContactsPage
} from './pages/contact_index.js';

document.addEventListener('DOMContentLoaded', async function () {
  addClickListener("loginButton", loginToWhatsappWeb);
  addClickListener("logoutLink", logoutFromWhatsappWeb);

  if (cookieExists("UserKey")) {
    const userToken = getCookie("UserKey");
    await fetchClientUserId(userToken)
      .then((response) => {
        if (response.status === 401) {
          console.log("Não foi possível fazer login com o Token armazenado. Autentique-se novamente");
          enableLoginPage();
          return {};
        } else {
          return response.json();
        }
      })
      .then(async (json) => {
        await setCookiesAndNotifyWhatsappTab(userToken, json.id);
      })
  } else {
    enableLoginPage();
  }
});


// Listeners from WhatsApp Web Chrome tab
chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
  if (message.data) {
    switch (message.data.type) {
      case "CurrentContactReceived":
        transitionToContactsPage(message.data.contact);
        break;
      case "CurrentContactNotFound":
        enableAlreadyLoggedInPage();
        break;
      default:
        break;
    }
    sendResponse({
      data: "OK"
    });
  }
});
