import {
  login,
  logout,
  fetchClientUserId
} from "./../api.js";

import {
  setCookiesAndNotifyWhatsappTab,
  unsetCookiesAndDisplayLoginPage
} from './shared.js';

// Login section
export async function loginToWhatsappWeb() {
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
      const userToken = loginResponseJson.jwt;
      await fetchClientUserId(userToken)
        .then((clientUserResponse) => clientUserResponse.json())
        .then(async (clientUserResponseJson) => {
          await setCookiesAndNotifyWhatsappTab(userToken, clientUserResponseJson.id);
        })
    });
};

export async function logoutFromWhatsappWeb() {
  const userToken = getCookie("UserKey");

  await logout(userToken).then(async (logoutResponse) => {
    if (logoutResponse.status === 401) {
      alert("Não foi possível fazer logout");
      return;
    }
    await unsetCookiesAndDisplayLoginPage();

    return logoutResponse.json()
  });
};
