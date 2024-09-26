import {
  fetchClientUserId,
  fetchComponents,
  fetchContactByExternalId,
  fetchComponentMappingFor,
  createContactByExternalId
} from "./api.js";

import {
  enableWhatsAppNotOpened,
  enableContactInfoPage,
  enableLoginPage,
  enableAlreadyLoggedInPage,
} from './pageHandler.js';

import {
  loginToWhatsappWeb,
  logoutFromWhatsappWeb
} from './pages/login.js';

document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById("loginButton").addEventListener("click", loginToWhatsappWeb);

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

  document.getElementById("logoutLink").addEventListener("click", logoutFromWhatsappWeb);
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

async function transitionToContactPage() {
  const userToken = getCookie("UserKey");
  const clientUserId = getCookie("ClientUserId");
  const externalId = "15997383817@us.com"

  await fetchContactByExternalId(userToken, externalId).then(async (response) => {
    if (response.status === 401) {
      await unsetCookiesAndDisplayLoginPage();
    } else {
      const contacts = await response.json();
      fillPageWithContactInfo(contacts);
    }
  });
}

function fillPageWithContactInfo(contacts, whatsappInfo = {
  name: "Oreia da Silva",
  profilePicUrl: "https://media-gru1-1.cdn.whatsapp.net/v/t61.24694-24/432998152_816058723788076_2053571525311385107_n.jpg?ccb=11-4&oh=01_Q5AaIFhDo1SCIHA5A2UKmClkYUdQB9m0aDt77RRY43ZD7InX&oe=66F81BD4&_nc_sid=5e03e0&_nc_cat=108",
  phoneNumber: "5515997302927",
}) {
  fillPageWithWhatsAppInfo(whatsappInfo);

  const entityMapping = {
    "ContactApp::Contact": { "name": "Contato" },
    "BusinessApp::Business": { "name": "Negócio" },
    "KanbanApp::Opportunity": { "name": "Oportunidade" }
  }

  if (contacts.length == 0) {
    document.getElementById("entries_info").innerText = "Esse contato não foi encontrado no seu Funil";
    document.getElementById("entries_sub_info").innerText = "Onde gostaria de adicioná-lo?";

    showComponentSelectionDropdown()
  } else {
    document.getElementById("entries_info").innerText = `Encontrada(s) ${contacts.length} entrada(s) para esse contato:`;

    const tablesContainer = document.querySelector(`#tables_container`);

    for (const contact of contacts) {
      const tableBody = createTable(contact.id);
      const link = createLink(`${contact.component_name} (${entityMapping[contact.entity_type].name})`, contact.url)
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

function fillPageWithWhatsAppInfo(whatsappInfo) {
  const contactNameElement = document.getElementById("contact_name");
  const contactPhotoElement = document.getElementById("contact_photo_img");
  const contactPhoneNumberElement = document.getElementById("contact_phone_number");

  if (contactNameElement) {
    contactNameElement.innerText = whatsappInfo.name;
  }

  if (contactPhotoElement) {
    contactPhotoElement.src = whatsappInfo.profilePicUrl;
  }

  if (contactPhoneNumberElement) {
    contactPhoneNumberElement.innerText = whatsappInfo.phoneNumber;
  }
}


async function showComponentSelectionDropdown() {
  const userToken = getCookie("UserKey");
  const clientUserId = getCookie("ClientUserId");

  await fetchComponents(userToken, clientUserId).then(async (response) => {
    if (response.status === 401) {
      await unsetCookiesAndDisplayLoginPage();
    } else {
      const components = await response.json();
      fillInComponentSelect(components);
    }
  });
}

function fillInComponentSelect(components) {
  const selectElement = createSelect("component_select");

  components.forEach(component => {
    addOptionToSelect(selectElement, component.id, `${component.name} (${component.project})`);
  });

  document.getElementById('dropdown_container').appendChild(selectElement);
  document.getElementById("component_select").addEventListener("change", showComponentMappingDetails);
}

async function showComponentMappingDetails() {
  const userToken = getCookie("UserKey");
  const componentId = document.getElementById("component_select").value;

  await fetchComponentMappingFor(userToken, componentId)
    .then(async (response) => {
      if (response.status === 401) {
        await unsetCookiesAndDisplayLoginPage();
      } else if (response.status === 422) {
        const errorCode = await response.json().code;
        if (errorCode === "ChatApp::UnableToSetContactMappingError") {
          alert("Esse componente não possui um campo de nome ou de telefone. Selecione outro componente ou adicione esses campos ao componente desejado");
        }
      } else {
        const mapping = await response.json();
        fillInComponentMappingDetails(mapping);
      }
    })
    .catch((error) => {
      alert(error);
    });
}

export async function createContact(apiToken, externalId, componentId, payload) {
  await createContactByExternalId(apiToken, externalId, componentId, payload)
    .then(async (response) => {
      if (response.status === 401) {
        await unsetCookiesAndDisplayLoginPage();
      } else if (response.status === 204) {
        transitionToContactPage();
      } else if (response.status === 422) {
        alert("O WhatsApp não está ativado nesse projeto. Ative o WhatsApp para criar contatos");
      }
    }
    );
};

function fillInComponentMappingDetails(
  mapping,
  name = "Oreia da Silva",
  phoneNumber = "5515997302927",
  externalId = "15997383817@us.com"
) {
  if (document.getElementById('contact_preview')) {
    document.getElementById('contact_preview').remove();
  }

  if (document.getElementById('create_contact_button')) {
    document.getElementById('create_contact_button').remove();
  }

  const userToken = getCookie("UserKey");
  const componentId = document.getElementById("component_select").value;

  const payload = {}
  payload[mapping.full_name] = name;
  payload[mapping.whatsapp_phone_number] = phoneNumber;

  const tablesContainer = document.querySelector(`#tables_container`);
  const contactPreview = createTable("contact_preview");
  addValueToTable(mapping.full_name, name, contactPreview);
  addValueToTable(mapping.whatsapp_phone_number, phoneNumber, contactPreview);
  tablesContainer.appendChild(contactPreview);

  if (document.getElementById('contact_preview')) {
    document.getElementById('contact_preview').remove();
  }

  const button = document.createElement('button');
  button.setAttribute('id', 'create_contact_button');
  button.style.background = 'none';
  button.style.color = 'blue';
  button.style.border = 'none';
  button.style.padding = '0';
  button.style.textDecoration = 'underline';
  button.style.cursor = 'pointer';
  // Enhance appearance
  button.style.fontSize = '16px';
  button.style.fontFamily = 'Arial, sans-serif';
  button.textContent = 'Criar Contato';
  button.addEventListener('click', function () {
    createContact(userToken, externalId, componentId, payload);
  });
  tablesContainer.appendChild(button);
}
