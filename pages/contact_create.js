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
  transitionToContactsPage
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
      showComponentMappingDetails();
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

  document.getElementById("show_contact_index").addEventListener("click", enableContactIndexPage);
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
}

function clearMappingSection() {
  removeElementById("contact_preview");
  removeElementById("create_contact_button");

  document.getElementById('mapping_warnings').textContent = "";
  document.getElementById('contact_preview_subtitle').textContent = "";
}

function currentContact() {
  return {
    senderName: document.getElementById("contact_name").textContent,
    formattedSenderNumber: document.getElementById("contact_phone_number").textContent,
    senderNumber: document.getElementById("full_contact_phone_number").textContent,
    senderId: document.getElementById("contact_external_id").textContent,
    profilePicThumb: document.getElementById("contact_photo_img").src
  }
}

function fillInComponentMappingDetails(mapping) {
  const userToken = getCookie("UserKey");
  const componentId = document.getElementById("component_select").value;

  const payload = {};

  payload[mapping.full_name] = currentContact().senderName;
  payload[mapping.whatsapp_phone_number] = currentContact().formattedSenderNumber;

  const contactSubmitArea = document.querySelector(`#contact_submit`);
  const contactPreview = createTable("contact_preview");
  addValueToTable(mapping.full_name, currentContact().senderName, contactPreview);
  addValueToTable(mapping.whatsapp_phone_number, currentContact().senderNumber, contactPreview);
  contactSubmitArea.appendChild(contactPreview);

  const p = document.createElement('p');
  const button = document.createElement('button');
  button.setAttribute('id', 'create_contact_button');
  button.textContent = 'Criar Contato';
  button.addEventListener('click', function () {
    createContact(userToken, currentContact().senderId, componentId, payload);
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
        transitionToContactsPage(currentContact());
      } else if (response.status === 422) {
        showMappingWarningMessage("O WhatsApp não está ativado nesse projeto. Ative o WhatsApp para criar contatos");
      }
    });
};
