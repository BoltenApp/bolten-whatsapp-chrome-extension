import {
  fetchClientUserId,
  fetchContactByExternalId,
} from "./api.js";

import {
  enableWhatsAppNotOpened,
  enableLoginPage,
  enableAlreadyLoggedInPage,
} from './pageHandler.js';

import {
  loginToWhatsappWeb,
  logoutFromWhatsappWeb
} from './pages/login.js';

import {
  showContactInfo
} from './pages/contact_info.js';

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
      })
  }
});

async function setCookiesAndNotifyWhatsappTab(userToken, clientUserId) {
  if (userToken && clientUserId) {
    setCookie("UserKey", userToken, 7);
    setCookie("ClientUserId", clientUserId, 7);
    notifyTab({ userToken: userToken, clientUserId: clientUserId }, enableAlreadyLoggedInPage, enableWhatsAppNotOpened);
    // TODO: Remove this line
    transitionToContactPage();
  }
}

async function unsetCookiesAndDisplayLoginPage() {
  setCookie("UserKey", '', 7);
  setCookie("ClientUserId", '', 7);
  notifyTab({ userToken: '', clientUserId: '' }, enableLoginPage, enableLoginPage);
}

export async function transitionToContactPage() {
  const userToken = getCookie("UserKey");
  const clientUserId = getCookie("ClientUserId");
  const externalId = "15997383817@us.commm"

  await fetchContactByExternalId(userToken, externalId).then(async (response) => {
    if (response.status === 401) {
      await unsetCookiesAndDisplayLoginPage();
    } else {
      const contacts = await response.json();
      showContactInfo(contacts);
    }
  });
}
