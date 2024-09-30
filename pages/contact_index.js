import {
  fetchContactByExternalId,
} from "./../api.js";

import {
  enableContactIndexPage
} from './../pageHandler.js';

import {
  showContactInfo
} from './contact_info.js';

import {
  showContactCreate
} from './contact_create.js';

import {
  unsetCookiesAndDisplayLoginPage
} from './shared.js';

export async function transitionToContactsPage(whatsappInfo) {
  const userToken = getCookie("UserKey");
  // const clientUserId = getCookie("ClientUserId");

  await fetchContactByExternalId(userToken, whatsappInfo.senderId).then(async (response) => {
    if (response.status === 401) {
      await unsetCookiesAndDisplayLoginPage();
    } else {
      const contacts = await response.json();
      showContactInfo(contacts, whatsappInfo);
    }
  });
}

export function showContactIndex(contacts) {
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
