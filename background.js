chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.data && request.data.type) {
    switch (request.data.type) {
      case "WhatsappWebConnected":
        chrome.action.setIcon({ path: "logo-38-green.png" });
        break;
      case "WhatsappWebDisconnected":
        chrome.action.setIcon({ path: "logo-38.png" });
        break;
      default:
        break;
    }
  }
})
