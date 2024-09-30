function setCookie(name, value, expirationInDays) {
  const d = new Date();
  d.setTime(d.getTime() + (expirationInDays * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/;domain=" + window.location.hostname;
}

function cookieExists(name) {
  return document.cookie.includes(name);
}

function getCookie(name) {
  unsplitted = document.cookie.split(name + "=")[1]
  if (unsplitted == undefined) {
    return ''
  }
  return unsplitted.split(";")[0];
}

function setStorage(key, value) {
  chrome.storage.local.set({ [key]: value });
}

async function getStorage(key) {
  const result = await chrome.storage.local.get([key]);
  return result[key];
}

async function notifyTab(message, successAction, failureAction) {
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (tab.url && tab.url.includes(Config.whatsappUrl)) {
      chrome.tabs.sendMessage(tab.id, message).then((response) => {
        console.info("Popup received response '%s'", response)
        successAction && successAction();
      }).catch((error) => {
        failureAction && failureAction();
        console.warn("Popup could not send message to tab %d", tab.id, error)
      })
      break;
    }
  }

  // console.log("Applying failure action")
  failureAction && failureAction();
}

function fullUrl(path) {
  return `https://${Config.baseUrl}${path}`;
}

function createTable(tableId) {
  var tableBody = document.createElement('div');
  tableBody.setAttribute("id", tableId);
  tableBody.setAttribute("class", "card");

  return tableBody;
}

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

function createSelect(selectId) {
  if (document.getElementById(selectId)) {
    document.getElementById(selectId).remove();
  }

  const selectElement = document.createElement('select');
  selectElement.setAttribute("id", selectId);

  return selectElement;
}

function addOptionToSelect(select, value, text) {
  const optionElement = document.createElement('option');
  optionElement.value = value;
  optionElement.textContent = text;
  select.appendChild(optionElement);
}

function createLink(text, url) {
  const contactUrl = `<a href="${fullUrl(url)}" target="_blank">${text}</a>`
  const temp = document.createElement('a');
  temp.innerHTML = contactUrl;
  const htmlObject = temp.firstChild;

  return htmlObject;
}

function createAnchor(text, elementId) {
  const contactUrl = `<a id=${elementId} href="#">${text}</a>`
  const temp = document.createElement('a');
  temp.innerHTML = contactUrl;
  const htmlObject = temp.firstChild;

  return htmlObject;
}

function fillElementWithText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    if (typeof text === "object") {
      element.appendChild(text);
    } else {
      element.textContent += text;
    }
  }
}

function clearElementText(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = "";
  }
}

function fillElementWithSrc(elementId, src) {
  const element = document.getElementById(elementId);
  if (element) {
    element.src = src;
  }
}

function removeElementById(elementId) {
  const element = document.getElementById(elementId);

  if (element) {
    element.remove();
  }
}

function addClickListener(elementId, action) {
  const element = document.getElementById(elementId);

  if (element) {
    element.addEventListener("click", action);
  }
}

function addChangeListener(elementId, action) {
  const element = document.getElementById(elementId);

  if (element) {
    element.addEventListener("change", action);
  }
}
