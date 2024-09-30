const pageIds = [
  "form_container",
  "already_logged_in_container",
  "whatsapp_web_not_opened",
  "contact_info",
  "loading_container",
];

const contactSubPageIds = [
  "contact_index",
  "contact_create"
]

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

export function enableLoadingPage() {
  enablePageByElementId("loading_container");
}

export function enableContactIndexPage() {
  enableContactSubPageByElementId("contact_index");
}

export function enableContactCreatePage() {
  enableContactSubPageByElementId("contact_create");
}

function enablePageByElementId(elementId) {
  pageIds.forEach((pageId) => {
    document.getElementById(pageId).style.display = "none";
  });

  document.getElementById(elementId).style.display = "";
}

function enableContactSubPageByElementId(elementId) {
  contactSubPageIds.forEach((pageId) => {
    document.getElementById(pageId).style.display = "none";
  });

  document.getElementById(elementId).style.display = "";
}
