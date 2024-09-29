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

// window.addEventListener("ChatWindowFocused", event => {
//   console.log("[Event Listener Added] ChatWindowFocused ON POPAP!!!")
//   console.log(event.detail);
// })

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("Message received: ", message);
  if (message.data.type === "ShowSenderInfo") {
    console.log("ShowSenderInfo");
    transitionToContactPage(message.data);
  }
  sendResponse({
    data: "I am fine, thank you. How is life in the background?"
  });
});


async function setCookiesAndNotifyWhatsappTab(userToken, clientUserId) {
  if (userToken && clientUserId) {
    setCookie("UserKey", userToken, 7);
    setCookie("ClientUserId", clientUserId, 7);
    console.log("Cookie set ClientUserId: ", clientUserId);
    notifyTab({ userToken: userToken, clientUserId: clientUserId }, enableAlreadyLoggedInPage, enableWhatsAppNotOpened);
    // TODO: Remove this line
    // FETCH CONTACT AND SHOW CURRENT ONE
    // fetchCurrentContact();
    transitionToContactPage();
  }
}

async function unsetCookiesAndDisplayLoginPage() {
  setCookie("UserKey", '', 7);
  setCookie("ClientUserId", '', 7);
  notifyTab({ userToken: '', clientUserId: '' }, enableLoginPage, enableLoginPage);
}

export async function transitionToContactPage(whatsappInfo = {
  senderName: "Oreia da Silva",
  profilePicThumb: "https://media-gru1-1.cdn.whatsapp.net/v/t61.24694-24/432998152_816058723788076_2053571525311385107_n.jpg?ccb=11-4&oh=01_Q5AaIFhDo1SCIHA5A2UKmClkYUdQB9m0aDt77RRY43ZD7InX&oe=66F81BD4&_nc_sid=5e03e0&_nc_cat=108",
  senderNumber: "5515997302927",
  senderId: "5515997302927@c.us"
}) {
  const userToken = getCookie("UserKey");
  const clientUserId = getCookie("ClientUserId");

  await fetchContactByExternalId(userToken, whatsappInfo.senderId).then(async (response) => {
    if (response.status === 401) {
      await unsetCookiesAndDisplayLoginPage();
    } else {
      const contacts = await response.json();
      showContactInfo(contacts, whatsappInfo);
    }
  });
}
