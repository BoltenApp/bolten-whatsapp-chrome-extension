document.addEventListener('DOMContentLoaded', async function () {
  if (document.cookie.includes("UserKey")) {
    userToken = document.cookie.split("UserKey=")[1].split(";")[0];
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
        clientUserId = json.id;

        if (userToken && clientUserId) {
          userLoggedIn = {
            userToken: userToken,
            clientUserId: json.id
          }

          setCookie("ClientUserId", json.id, 7);
          // window.postMessage({ type: "UserloggedIn", userLoggedIn }, "*");

          disableLoginPage();
        }
      })
  }

  document.getElementById("loginButton").addEventListener("click", loginToWhatsappWeb);
});

function loginToWhatsappWeb() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert('Por favor, preencha os campos de e-mail e senha');
    return;
  }
  fetch("https://equipped-concise-owl.ngrok-free.app/api/login.json", {
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
    .then((response) => response.json())
    .then(async (json) => {
      userToken = json.jwt;
      clientUserId = await fetchClientUserId(userToken)
        .then((response2) => response2.json())
        .then(async (json2) => {
          userLoggedIn = {
            userToken: userToken,
            clientUserId: json2.id
          }
          console.log("Dispatching UserloggedIn event", userLoggedIn);

          setCookie("UserKey", userToken, 7);
          setCookie("ClientUserId", json2.id, 7);

          disableLoginPage();

          window.postMessage({ type: "UserloggedIn", userLoggedIn }, "*");
        })
    });
};

function disableLoginPage() {
  document.getElementById("form_container").style.display = "none";
  document.getElementById("already_logged_in_container").style.display = "";
}

async function fetchClientUserId(apiToken) {
  return await fetch("https://equipped-concise-owl.ngrok-free.app/api/v1/client_users/me.json", {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    }
  })
};

function setCookie(name, value, expirationInDays) {
  const d = new Date();
  d.setTime(d.getTime() + (expirationInDays * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/;domain=" + window.location.hostname;
}
