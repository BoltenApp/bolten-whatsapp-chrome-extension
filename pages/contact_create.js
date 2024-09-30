import {
  fetchComponents,
  fetchComponentMappingFor,
  createContactByExternalId
} from "./../api.js";

import {
  enableContactIndexPage,
  enableContactCreatePage
} from './../pageHandler.js';

import {
  unsetCookiesAndDisplayLoginPage
} from './shared.js';

import {
  transitionToContactPage
} from './contact_index.js';

export function showContactCreate() {
  showComponentSelectionDropdown();
  showContactIndexOption();
  enableContactCreatePage();
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

  fillElementWithText('dropdown_container', selectElement);
  addChangeListener('component_select', showComponentMappingDetails);
}

function showContactIndexOption() {
  const entriesInfo = document.getElementById("entries_info")

  if (entriesInfo.textContent === "Esse contato não foi encontrado no seu Funil") {
    return
  }

  document.getElementById("showContactIndex").addEventListener("click", enableContactIndexPage);
  document.getElementById("contact_index").style.display = "";
}

async function showComponentMappingDetails() {
  clearMappingSection();

  const userToken = getCookie("UserKey");
  const componentId = document.getElementById("component_select").value;

  await fetchComponentMappingFor(userToken, componentId).then(async (response) => {
    const body = await response.json();

    if (response.status === 200) {
      fillInComponentMappingDetails(body);
    } else if (response.status === 401) {
      await unsetCookiesAndDisplayLoginPage();
    } else if (response.status === 422) {
      treatMappingLogicErrors(body)
    } else {
      showMappingWarningMessage("Estamos com uma instabilidade no sistema. Por favor, tente novamente mais tarde.");
    }
  });
}

function treatMappingLogicErrors(body) {
  if (body.code === "ChatApp::UnableToSetContactMappingError") {
    return showMappingWarningMessage("Esse componente não possui um campo de nome ou de telefone. Selecione outro componente ou adicione esses campos ao componente desejado.");
  }

  showMappingWarningMessage("Houve um erro inesperado. Por favor, contacte o suporte da Bolten.");
}

function showMappingWarningMessage(message) {
  document.getElementById('mapping_warnings').textContent = message
  // document.getElementById('bolty_help').style.display = "";
}

function clearMappingSection() {
  removeElementById("contact_preview");
  removeElementById("create_contact_button");

  document.getElementById('mapping_warnings').textContent = "";
  document.getElementById('contact_preview_subtitle').textContent = "";
  // document.getElementById('bolty_help').style.display = "none";
}

function fillInComponentMappingDetails(
  mapping,
  name = "Oreia da Silva",
  phoneNumber = "5515997302927",
  externalId = "15997383817@us.commm"
) {
  const userToken = getCookie("UserKey");
  const componentId = document.getElementById("component_select").value;

  const payload = {}
  payload[mapping.full_name] = name;
  payload[mapping.whatsapp_phone_number] = phoneNumber;

  const contactSubmitArea = document.querySelector(`#contact_submit`);
  const contactPreview = createTable("contact_preview");
  // addValueToTable("Prévia do Contato", "\n", contactPreview);
  addValueToTable(mapping.full_name, name, contactPreview);
  addValueToTable(mapping.whatsapp_phone_number, phoneNumber, contactPreview);
  // fillElementWithText('contact_preview_subtitle', "Prévia do Contato");
  contactSubmitArea.appendChild(contactPreview);

  const p = document.createElement('p');
  const button = document.createElement('button');
  button.setAttribute('id', 'create_contact_button');
  button.textContent = 'Criar Contato';
  button.addEventListener('click', function () {
    createContact(userToken, externalId, componentId, payload);
  });
  p.appendChild(button);
  contactPreview.appendChild(p);
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
