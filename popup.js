import {
  fetchClientUserId,
} from "./api.js";

import {
  enableWhatsAppNotOpened,
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
  transitionToContactPage
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
          return {};
        } else {
          return response.json();
        }
      })
      .then(async (json) => {
        await setCookiesAndNotifyWhatsappTab(userToken, json.id, enableAlreadyLoggedInPage, enableWhatsAppNotOpened);
        fetchCurrentContact()
      })
  }
});

function fetchCurrentContact() {
  notifyTab(
    {
      type: "CurrentContactRequested"
    },
    enableAlreadyLoggedInPage,
    enableWhatsAppNotOpened
  );
}

// Listeners from WhatsApp Web Chrome tab
chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
  if (message.data && message.data.type === "CurrentContactReceived") {
    transitionToContactPage(message.data.contact);
  }
  sendResponse({
    data: "OK"
  });
});
