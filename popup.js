const loginRoute = `https://${Config.baseUrl}/api/login.json`;
const meRoute = `https://${Config.baseUrl}/api/v1/client_users/me.json`;
const whatsappWebContactsRoute = `https://${Config.baseUrl}/api/v1/whatsapp_web/contacts.json`;

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
        await setCookiesAndNotifyWhatsappTab(userToken, json.id);
      })
  }
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
          await setCookiesAndNotifyWhatsappTab(userToken, clientUserResponseJson.id);
        })
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



async function fetchComponents(clientUserId, apiToken) {
  return await fetch(componentsRouteFor(clientUserId), {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    }
  })
}

function componentsRouteFor(clientUserId) {
  return `https://${Config.baseUrl}/api/v1/client_users/${clientUserId}/components?filter=mappable_to_whatsapp_contact.json`
}

async function setCookiesAndNotifyWhatsappTab(userToken, clientUserId) {
  if (userToken && clientUserId) {
    setCookie("UserKey", userToken, 7);
    setCookie("ClientUserId", clientUserId, 7);
    notifyTab({ userToken: userToken, clientUserId: clientUserId });
    disableLoginPage();
  }
}

async function notifyTab(message) {
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (tab.url && tab.url.includes(Config.whatsappUrl)) {
      chrome.tabs.sendMessage(tab.id, message).then((response) => {
        console.info("Popup received response '%s'", response)
      }).catch((error) => {
        console.warn("Popup could not send message to tab %d", tab.id, error)
      })
    }
  }
}


function disableLoginPage() {
  document.getElementById("form_container").style.display = "none";
  document.getElementById("already_logged_in_container").style.display = "";
}
