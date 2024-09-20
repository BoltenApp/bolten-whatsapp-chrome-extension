const loginRoute = `https://${Config.baseUrl}/api/login.json`;
const logoutRoute = `https://${Config.baseUrl}/api/logout.json`;
const meRoute = `https://${Config.baseUrl}/api/v1/client_users/me.json`;

document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById("loginButton").addEventListener("click", loginToWhatsappWeb);

  if (cookieExists("UserKey")) {
    userToken = getCookie("UserKey");
    clientUserId = await fetchClientUserId(userToken)
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

  document.getElementById("logoutLink").addEventListener("click", logoutFromWhatsappWeb);
});

async function loginToWhatsappWeb() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert('Por favor, preencha os campos de e-mail e senha');
    return;
  }

  await login(email, password)
    .then((loginResponse) => {
      if (loginResponse.status === 401) {
        alert("E-mail ou senha inválidos");
        return;
      }
      return loginResponse.json()
    })
    .then(async (loginResponseJson) => {
      userToken = loginResponseJson.jwt;
      clientUserId = await fetchClientUserId(userToken)
        .then((clientUserResponse) => clientUserResponse.json())
        .then(async (clientUserResponseJson) => {
          await setCookiesAndNotifyWhatsappTab(userToken, clientUserResponseJson.id, enableAlreadyLoggedInPage, enableWhatsAppNotOpened);
        })
    });
};

async function logoutFromWhatsappWeb() {
  const apiToken = getCookie("UserKey");

  await logout(apiToken).then(async (logoutResponse) => {
    if (logoutResponse.status === 401) {
      alert("Não foi possível fazer logout");
      return;
    }
    await unsetCookiesAndDisplayLoginPage();

    return logoutResponse.json()
  });
};

async function login(email, password) {
  return await fetch(loginRoute, {
    method: "POST",
    body: JSON.stringify({
      api_user: {
        email: email,
        password: password
      }
    }),
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json"
    }
  })
}

async function logout(apiToken) {
  return await fetch(logoutRoute, {
    method: "DELETE",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    }
  })
};

async function fetchClientUserId(apiToken) {
  return await fetch(meRoute, {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    }
  })
};

async function setCookiesAndNotifyWhatsappTab(userToken, clientUserId) {
  if (userToken && clientUserId) {
    setCookie("UserKey", userToken, 7);
    setCookie("ClientUserId", clientUserId, 7);
    notifyTab({ userToken: userToken, clientUserId: clientUserId }, enableAlreadyLoggedInPage, enableWhatsAppNotOpened);
  }
}

async function unsetCookiesAndDisplayLoginPage() {
  setCookie("UserKey", '', 7);
  setCookie("ClientUserId", '', 7);
  notifyTab({ userToken: '', clientUserId: '' }, enableLoginPage, enableLoginPage);
}

async function notifyTab(message, successAction, failureAction) {
  const tabs = await chrome.tabs.query({});

  console.log("Popup sending message to tabs", tabs)

  for (const tab of tabs) {
    if (tab.url && tab.url.includes(Config.whatsappUrl)) {
      chrome.tabs.sendMessage(tab.id, message).then((response) => {
        console.info("Popup received response '%s'", response)
        successAction && successAction();
      }).catch((error) => {
        failureAction && failureAction();
        console.warn("Popup could not send message to tab %d", tab.id, error)
      })

      break;
    }
  }

  console.log("Applying failure action")
  failureAction && failureAction();
}

function enableLoginPage() {
  document.getElementById("form_container").style.display = "";
  document.getElementById("already_logged_in_container").style.display = "none";
  document.getElementById("whatsapp_web_not_opened").style.display = "none";
}

function enableAlreadyLoggedInPage() {
  document.getElementById("form_container").style.display = "none";
  document.getElementById("already_logged_in_container").style.display = "";
  document.getElementById("whatsapp_web_not_opened").style.display = "none";
}

function enableWhatsAppNotOpened() {
  document.getElementById("form_container").style.display = "none";
  document.getElementById("already_logged_in_container").style.display = "none";
  document.getElementById("whatsapp_web_not_opened").style.display = "";
}
