const loginRoute = `https://${Config.baseUrl}/api/login.json`;
const logoutRoute = `https://${Config.baseUrl}/api/logout.json`;
const meRoute = `https://${Config.baseUrl}/api/v1/client_users/me.json`;
const contactsRoute = `https://${Config.baseUrl}/api/v1/whatsapp_contacts`;

// Prevents extension from closing when clicking on another tab
// document.addEventListener('click', evt => {
//   console.log("KOKOKO")
//   const a = evt.target.closest('a[href]');
//   if (a) {
//     evt.preventDefault();
//     chrome.tabs.create({ url: a.href, active: false });
//   }
// });

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
  // enableContactInfoPage()
});

const pageIds = [
  "form_container",
  "already_logged_in_container",
  "whatsapp_web_not_opened",
  "contact_info"
];

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



async function fetchComponents(clientUserId, apiToken) {
  return await fetch(componentsRouteFor(clientUserId), {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    }
  })
};

async function fetchContactByExternalId(apiToken, externalId) {
  return await fetch(`${contactsRoute}?external_id=${externalId}`, {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    }
  })
};

async function createContactByExternalId(apiToken, externalId, componentId, data) {
  return await fetch(`${contactsRoute}`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${apiToken}`
    },
    body: JSON.stringify({
      componentId: componentId,
      whatsapp_contact: {
        externalId: externalId
      },
      data: data
    })
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

  for (const tab of tabs) {
    if (tab.url && tab.url.includes(Config.whatsappUrl)) {
      chrome.tabs.sendMessage(tab.id, message).then((response) => {
        console.info("Popup received response '%s'", response)
        successAction && successAction();
        // enableContactInfoPage()
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

function componentsRouteFor(clientUserId) {
  return `https://${Config.baseUrl}/api/v1/client_users/${clientUserId}/components?filter=mappable_to_whatsapp_contact.json`
}

function enableLoginPage() {
  enablePageByElementId("form_container");
}

function enableAlreadyLoggedInPage() {
  console.log("CHAMANO CONTAINER!!")
  enablePageByElementId("already_logged_in_container");
  console.log("CHAMANO TRANSICAO!!!!!")
  transitionToContactPage();
}

async function transitionToContactPage() {
  console.log("VO TRANSICIONAA!!")
  userToken = getCookie("UserKey");
  // clientUserId = getCookie("ClientUserId");
  externalId = "15997383817@us.co"

  await fetchContactByExternalId(userToken, externalId)
    .then(async (response) => {
      if (response.status === 401) {
        await unsetCookiesAndDisplayLoginPage();
      } else {
        const contacts = await response.json();
        fillPageWithContactInfo(contacts);
      }
    });
}

function fillPageWithContactInfo(contactInfo) {
  if (contactInfo.length == 0) {
    document.getElementById("contact_main_area").innerText = "Esse contato não foi encontrado";
    document.getElementById("contact_sub_area").innerText = "Gostaria de adicioná-lo?";
  } else {
    document.getElementById("contact_main_area").innerText = `Encontrada(s) ${contactInfo.length} entrada(s) para esse contato:`;

    const tablesContainer = document.querySelector(`#tables_container`);

    for (const contact of contactInfo) {
      const tableBody = createTable(contact.id);
      // const tableContainer = createTable(contact.id);
      // tablesContainer.appendChild(tableContainer);
      const link = createLink(`${contact.component_name} (${entityMapping[contact.entity_type].name})`, contact.url)
      // const headers = [
      //   "Tipo",
      //   "Componente",
      //   ...Object.keys(contact.data)
      // ]
      // const values = [
      //   entityMapping[contact.entity_type].name,
      //   link,
      //   ...Object.values(contact.data)
      // ]
      // addHeadersToTable(contact.id, headers);
      // addValuesToTable(contact.id, values);

      // addValueToTable("Tipo", entityMapping[contact.entity_type].name, tableBody);
      addValueToTable("Encontrado em", link, tableBody);

      for (let key in contact.data) {
        if (contact.data.hasOwnProperty(key)) {
          if (contact.data[key] != null && contact.data[key] != "" && contact.data[key] != "-")
            addValueToTable(key, contact.data[key], tableBody);
        }
      }

      tablesContainer.appendChild(tableBody);
    }
  }

  enableContactInfoPage();
}

const entityMapping = {
  "ContactApp::Contact": {
    "name": "Contato"
  },
  "BusinessApp::Business": {
    "name": "Negócio"
  },
  "KanbanApp::Opportunity": {
    "name": "Oportunidade"
  }
}

// function createTable(tableId) {
//   var tableBody = document.createElement('table');
//   tableBody.setAttribute("id", tableId);
//   tableBody.setAttribute("class", "table");
//   var tableHead = document.createElement("thead");
//   var valueBody = document.createElement("tbody");

//   tableBody.appendChild(tableHead);
//   tableBody.appendChild(valueBody);

//   return tableBody;
// }

// function createTable(tableId) {
//   var tableContainer = document.createElement('div');
//   tableContainer.setAttribute("class", "container-table100");
//   tableContainer.setAttribute("id", `container-table-${tableId}`);

//   var tableWrapper = document.createElement('div');
//   tableWrapper.setAttribute("class", "wrap-table100");
//   tableWrapper.setAttribute("id", `wrap-table-${tableId}`);

//   var tableBody = document.createElement('div');
//   tableBody.setAttribute("class", "table");
//   tableBody.setAttribute("id", `table-${tableId}`);

//   var rowHeader = document.createElement("div");
//   rowHeader.setAttribute("class", "row header");
//   rowHeader.setAttribute("id", `header-${tableId}`);

//   var row = document.createElement("div");
//   row.setAttribute("class", "row");
//   row.setAttribute("id", `row-${tableId}`);

//   tableContainer.appendChild(tableWrapper);
//   tableWrapper.appendChild(tableBody);

//   tableBody.appendChild(rowHeader);
//   tableBody.appendChild(row);

//   return tableContainer;
// }

function createTable(tableId) {
  var tableBody = document.createElement('div');
  tableBody.setAttribute("id", tableId);
  tableBody.setAttribute("class", "card");

  return tableBody;
}


function addHeadersToTable(tableId, headers) {
  var header = document.getElementById(`header-${tableId}`);

  headers.forEach((headerText) => {
    var cell = document.createElement("div");
    cell.setAttribute("class", "cell");
    cell.textContent = headerText;
    header.appendChild(cell);
  });

  return header;
}

function addValuesToTable(tableId, values) {
  var row = document.getElementById(`row-${tableId}`);

  values.forEach((value) => {
    var cell = document.createElement("div");
    cell.setAttribute("class", "cell");
    if (typeof value === "object") {
      cell.appendChild(value);
    } else {
      cell.setAttribute("data-title", value);
      cell.textContent = value;
    }
    row.appendChild(cell);
  });

  return row;
}

function createLink(text, url) {
  const contactUrl = `<a href="${fullUrl(url)}" target="_blank">${text}</a>`
  const temp = document.createElement('a');
  temp.innerHTML = contactUrl;
  const htmlObject = temp.firstChild;

  return htmlObject;
}

// function addValueToTable(key, value, tableBody) {
//   const row = document.createElement("tr");
//   const keyCell = document.createElement("td");
//   const valueCell = document.createElement("td");

//   keyCell.textContent = key;

//   if (typeof value === "object") {
//     valueCell.appendChild(value);
//   } else {
//     valueCell.textContent = value;
//   }

//   row.appendChild(keyCell);
//   row.appendChild(valueCell);

//   tableBody.appendChild(row);
// }

function addValueToTable(key, value, tableBody) {
  const keyCell = document.createElement("p");
  const bold = document.createElement("b");
  keyCell.appendChild(bold);
  bold.textContent = `${key}: `;

  if (typeof value === "object") {
    keyCell.appendChild(value);
  } else {
    keyCell.textContent += value;
  }

  tableBody.appendChild(keyCell);
}

function fullUrl(path) {
  return `https://${Config.baseUrl}${path}`;
}

function enableWhatsAppNotOpened() {
  enablePageByElementId("whatsapp_web_not_opened");
}

function enableContactInfoPage() {
  enablePageByElementId("contact_info");
}

function enablePageByElementId(elementId) {
  console.log("ESTOU SENO CHAMADO!!!")
  console.log(elementId)

  pageIds.forEach((pageId) => {
    document.getElementById(pageId).style.display = "none";
  });

  document.getElementById(elementId).style.display = "";
}
