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
  enableContactIndexPage,
  enableContactCreatePage
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
  showContactCount(contacts.length);

  document.getElementById("logoutLinkContact").addEventListener("click", logoutFromWhatsappWeb);
  enableContactInfoPage();

  if (contacts.length == 0) {
    return showContactCreate()
  }

  showContactIndex(contacts);
}

function showContactCount(contactCount) {
  clearElementText("entries_info");

  if (contactCount > 0) {
    const link = createAnchor(`${contactCount} entrada(s) encontrada(s) para esse contato`, "showContactIndex")
    fillElementWithText("entries_info", link)
  } else {
    fillElementWithText("entries_info", "Esse contato não foi encontrado no seu Funil")
  }
}

function fillPageWithWhatsAppInfo(whatsappInfo) {
  clearElementText("contact_name");
  clearElementText("contact_phone_number");

  fillElementWithText("contact_name", whatsappInfo.name);
  fillElementWithText("contact_phone_number", `✆  ${whatsappInfo.phoneNumber}`);
  fillElementWithSrc("contact_photo_img", whatsappInfo.profilePicUrl);
}

function showContactIndex(contacts) {
  const entityMapping = {
    "ContactApp::Contact": { "name": "Contato" },
    "BusinessApp::Business": { "name": "Negócio" },
    "KanbanApp::Opportunity": { "name": "Oportunidade" }
  }

  const contactsContainer = document.querySelector(`#contacts_container`);
  contactsContainer.innerHTML = "";

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

    contactsContainer.appendChild(tableBody);
  }

  document.getElementById("showContactCreate").addEventListener("click", showContactCreate);
  enableContactIndexPage()
}

function showContactCreate() {
  showComponentSelectionDropdown();
  enableContactCreatePage();
  showContactIndexOption();
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

function showContactIndexOption() {
  const entriesInfo = document.getElementById("entries_info")

  if (entriesInfo.textContent === "Esse contato não foi encontrado no seu Funil") {
    return
  }

  document.getElementById("showContactIndex").addEventListener("click", enableContactIndexPage);
  document.getElementById("show_contact_index").style.display = "";
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
  clearMappingSection();

  const userToken = getCookie("UserKey");
  const componentId = document.getElementById("component_select").value;

  await fetchComponentMappingFor(userToken, componentId).then(async (response) => {
    const body = await response.json();

    if (response.status === 401) {
      await unsetCookiesAndDisplayLoginPage();
    } else if (response.status === 422) {
      treatMappingLogicErrors(body)
    } else if (response.status === 200) {
      fillInComponentMappingDetails(body);
    } else {
      showMappingWarningMessage("Estamos com uma instabilidade no sistema. Por favor, tente novamente mais tarde.");
    }
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
        showMappingWarningMessage("O WhatsApp não está ativado nesse projeto. Ative o WhatsApp para criar contatos");
      }
    });
};

function treatMappingLogicErrors(body) {
  if (body.code === "ChatApp::UnableToSetContactMappingError") {
    return showMappingWarningMessage("Esse componente não possui um campo de nome ou de telefone. Selecione outro componente ou adicione esses campos ao componente desejado.");
  }

  showMappingWarningMessage("Houve um erro inesperado. Por favor, contacte o suporte da Bolten.");
}

function showMappingWarningMessage(message) {
  document.getElementById('mapping_warnings').textContent = message
  document.getElementById('mapping_help_section').style.display = "";
}

function clearMappingSection() {
  removeElementById("contact_preview");
  removeElementById("create_contact_button");

  document.getElementById('mapping_warnings').textContent = "";
  document.getElementById('mapping_help_section').style.display = "none";
}

function fillInComponentMappingDetails(
  mapping,
  name = "Oreia da Silva",
  phoneNumber = "5515997302927",
  externalId = "15997383817@us.com"
) {
  const userToken = getCookie("UserKey");
  const componentId = document.getElementById("component_select").value;

  const payload = {}
  payload[mapping.full_name] = name;
  payload[mapping.whatsapp_phone_number] = phoneNumber;

  const contactSubmitArea = document.querySelector(`#contact_submit`);
  const contactPreview = createTable("contact_preview");
  addValueToTable(mapping.full_name, name, contactPreview);
  addValueToTable(mapping.whatsapp_phone_number, phoneNumber, contactPreview);
  contactSubmitArea.appendChild(contactPreview);

  const button = document.createElement('button');
  button.setAttribute('id', 'create_contact_button');
  // button.type = 'submit';
  button.textContent = 'Criar Contato';
  button.addEventListener('click', function () {
    createContact(userToken, externalId, componentId, payload);
  });
  contactSubmitArea.appendChild(button);
}
