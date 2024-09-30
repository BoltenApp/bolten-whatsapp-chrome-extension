import {
  enableContactInfoPage,
} from './../pageHandler.js';

import {
  logoutFromWhatsappWeb
} from './login.js';

import {
  showContactIndex
} from './contact_index.js';

import {
  showContactCreate
} from './contact_create.js';

export function showContactInfo(contacts, whatsappInfo) {
  addClickListener("logoutLinkContact", logoutFromWhatsappWeb);

  fillPageWithWhatsAppInfo(whatsappInfo);
  showContactCount(contacts.length);

  enableContactInfoPage();

  contacts.length == 0 ? showContactCreate() : showContactIndex(contacts);
}

function fillPageWithWhatsAppInfo(whatsappInfo) {
  clearElementText("contact_name");
  clearElementText("contact_phone_number");
  clearElementText("mapping_warnings");

  fillElementWithText("contact_name", whatsappInfo.senderName);
  fillElementWithText("contact_phone_number", `${whatsappInfo.senderNumber.slice(2)}`);
  fillElementWithText("contact_external_id", whatsappInfo.senderId);
  fillElementWithSrc("contact_photo_img", whatsappInfo.profilePicThumb);
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
