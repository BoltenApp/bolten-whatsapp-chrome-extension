const webSocketUrl = `wss://${Config.baseUrl}/cable`;
const channel = Config.channel
let webSocket = null;
let apiToken = null;
let clientUserId = null;

async function connect() {
  apiToken = await getStorage("UserKey");
  clientUserId = await getStorage("ClientUserId");

  if (!apiToken || !clientUserId) {
    return;
  }

  await flushWebSocket(apiToken);

  webSocket.onopen = (_event) => {
    subscribeToBolten();
  };

  webSocket.onmessage = (event) => {
    handleBoltenMessages(event);
  };

  webSocket.onclose = (_event) => {
    window.dispatchEvent(new CustomEvent("WhatsappWebDisconnected"));
  };
}

async function flushWebSocket(apiToken) {
  if (webSocket !== null) {
    unsubscribeToBolten()
  }

  webSocket = new WebSocket(`${webSocketUrl}?api_token=${apiToken}`);
}

function subscribeToBolten() {
  if (!apiToken || !clientUserId) {
    return;
  }

  const subscribeCommand = {
    command: 'subscribe',
    identifier: JSON.stringify({
      id: clientUserId,
      channel: channel
    }),
  };

  webSocket.send(JSON.stringify(subscribeCommand));
}

function unsubscribeToBolten() {
  if (!apiToken || !clientUserId) {
    return;
  }

  const unsubscribeCommand = {
    command: 'unsubscribe',
    identifier: JSON.stringify({
      id: clientUserId,
      channel: channel
    }),
  };

  webSocket.send(JSON.stringify(unsubscribeCommand));
}

function handleBoltenMessages(event) {
  console.debug("Websocket event received", event)
  const message = JSON.parse(event.data).message;

  if (message) {
    switch (message.action) {
      case 'fetch_conversation_on_whatsapp_web':
        window.dispatchEvent(new CustomEvent("ConversationRequested", {
          detail: {
            senderNumber: message.sender_number,
            recipientNumber: message.recipient_number,
            messageLimit: message.message_listing_limit,
          }
        }));
        break;
      case 'send_message_to_whatsapp_web':
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
}

async function sendActionToWebsocket(action, body) {
  if (!apiToken || !clientUserId) {
    return;
  }

  const payload = {
    command: 'message',
    data: JSON.stringify({
      action: action,
      body: JSON.stringify(body)
    }),
    identifier: JSON.stringify({
      id: clientUserId,
      channel: channel
    }),
  };

  const msg = JSON.stringify(payload)

  webSocket.send(msg);
}
