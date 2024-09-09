chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request == "WhatsappWebConnected") {
    chrome.action.setIcon({ path: "logo-38-green.png" });
  } else if (request == "WhatsappWebDisconnected") {
    chrome.action.setIcon({ path: "logo-38.png" });
  }
})
