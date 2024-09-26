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

export function showContactInfo(contacts, whatsappInfo = {
  name: "Oreia da Silva",
  profilePicUrl: "https://media-gru1-1.cdn.whatsapp.net/v/t61.24694-24/432998152_816058723788076_2053571525311385107_n.jpg?ccb=11-4&oh=01_Q5AaIFhDo1SCIHA5A2UKmClkYUdQB9m0aDt77RRY43ZD7InX&oe=66F81BD4&_nc_sid=5e03e0&_nc_cat=108",
  phoneNumber: "5515997302927",
}) {
  addClickListener("logoutLinkContact", logoutFromWhatsappWeb);

  fillPageWithWhatsAppInfo(whatsappInfo);
  showContactCount(contacts.length);

  enableContactInfoPage();

  contacts.length == 0 ? showContactCreate() : showContactIndex(contacts);
}

function fillPageWithWhatsAppInfo(whatsappInfo) {
  clearElementText("contact_name");
  clearElementText("contact_phone_number");

  fillElementWithText("contact_name", whatsappInfo.name);
  fillElementWithText("contact_phone_number", `✆  ${whatsappInfo.phoneNumber}`);
  fillElementWithSrc("contact_photo_img", whatsappInfo.profilePicUrl);
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
