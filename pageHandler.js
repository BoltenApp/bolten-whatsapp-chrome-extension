const pageIds = [
  "form_container",
  "already_logged_in_container",
  "whatsapp_web_not_opened",
  "contact_info"
];

export function enableWhatsAppNotOpened() {
  enablePageByElementId("whatsapp_web_not_opened");
}

export function enableContactInfoPage() {
  enablePageByElementId("contact_info");
}

export function enableLoginPage() {
  enablePageByElementId("form_container");
}

export function enableAlreadyLoggedInPage() {
  enablePageByElementId("already_logged_in_container");
}

function enablePageByElementId(elementId) {
  pageIds.forEach((pageId) => {
    document.getElementById(pageId).style.display = "none";
  });

  document.getElementById(elementId).style.display = "";
}
