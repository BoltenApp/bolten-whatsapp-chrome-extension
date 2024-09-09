const webSocketUrl = `wss://${Config.baseUrl}/cable`;
const channel = Config.channel
webSocket = null;

function connect() {
  if (!cookieExists("ClientUserId")) {
    console.log("ClientUserId cookie not found");
    return;
  }

  webSocket = new WebSocket(webSocketUrl);

  webSocket.onopen = (_event) => {
    subscribeToBolten();
  };

  webSocket.onmessage = (event) => {
    handleBoltenMessages(event);
  };

  webSocket.onclose = (_event) => {
    console.log('websocket connection closed');
    disconnect();
  };
}

function subscribeToBolten() {
  const subscribeCommand = {
    command: 'subscribe',
    identifier: JSON.stringify({
      id: getCookie('ClientUserId'),
      channel: channel
    }),
  };

  webSocket.send(JSON.stringify(subscribeCommand));
  window.dispatchEvent(new CustomEvent("WhatsappWebConnected"));
}

function handleBoltenMessages(event) {
  console.log(`websocket received message: ${event.data}`);
  const message = JSON.parse(event.data).message;

  if (message) {
    switch (message.action) {
      case 'fetch_conversation_on_whatsapp_web':
        console.log(`[WS] Fetching conversation from ${message}`);
        window.dispatchEvent(new CustomEvent("ConversationRequested", {
          detail: {
            senderNumber: message.sender_number,
            recipientNumber: message.recipient_number,
            messageLimit: message.message_listing_limit,
          }
        }));
        break;
      case 'send_message_to_whatsapp_web':
        console.log(`[WS] Message sent to ${message.recipient_number}`);
        window.dispatchEvent(new CustomEvent("MessageDispatchRequested", {
          detail: {
            externalId: message.external_id,
            recipientNumber: message.recipient_number,
            message: message.message,
          }
        }));
        break;
      default:
        break;
    }
  }
}

function disconnect() {
  if (webSocket == null) {
    return;
  }
  webSocket.close();
  window.dispatchEvent(new CustomEvent("WhatsappWebDisconnected"));
}

function sendActionToWebsocket(action, body) {
  const payload = {
    command: 'message',
    data: JSON.stringify({
      action: action,
      body: JSON.stringify(body)
    }),
    identifier: JSON.stringify({
      id: getCookie('ClientUserId'),
      channel: channel
    }),
  };

  webSocket.send(JSON.stringify(payload));
}
