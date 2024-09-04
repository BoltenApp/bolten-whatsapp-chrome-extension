
function connect() {
	webSocket = new WebSocket('wss://equipped-concise-owl.ngrok-free.app/cable');

	webSocket.onopen = (event) => {
		const subscribeCommand = {
			command: 'subscribe',
			identifier: JSON.stringify({
				id: 'fbdd54b9-d7cf-441b-bdbd-1573f258c221',
				channel: 'ChatApp::WhatsappWebClientUserChannel'
			}),
		};

		webSocket.send(JSON.stringify(subscribeCommand));
	};

	webSocket.onmessage = (event) => {
		console.log(`websocket received message: ${event.data}`);
		message = JSON.parse(event.data).message;

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
					}))
					break;
				case 'send_message_to_whatsapp_web':
					console.log(`[WS] Message sent to ${message.recipient_number}`);
					window.dispatchEvent(new CustomEvent("MessageDispatchRequested", {
						detail: {
							externalId: message.external_id,
							recipientNumber: message.recipient_number,
							message: message.message,
						}
					}))
					break;
				default:
					console.log('Unknown action');
					break;
			}
		}
	};

	webSocket.onclose = (event) => {
		console.log('websocket connection closed');
		webSocket = null;
	};
}

function disconnect() {
	if (webSocket == null) {
		return;
	}
	webSocket.close();
}

function reconnectIfNeeded() {
	if (webSocket == null) {
		connect();
	}
}

function keepAlive() {
	const keepAliveIntervalId = setInterval(
		() => {
			if (webSocket) {
				webSocket.send('keepalive');
			} else {
				clearInterval(keepAliveIntervalId);
			}
		},
		15 * 1000
	);
}

function sendActionToWebsocket(action, body) {
	const payload = {
		command: 'message',
		data: JSON.stringify({
			action: action,
			body: JSON.stringify(body)
		}),
		identifier: JSON.stringify({
			id: 'fbdd54b9-d7cf-441b-bdbd-1573f258c221',
			channel: 'ChatApp::WhatsappWebClientUserChannel'
		}),
	};

	webSocket.send(JSON.stringify(payload));
}

connect()

window.addEventListener("ConversationReceived", event => {
	reconnectIfNeeded()
	sendActionToWebsocket('display_conversation_on_chat', event.detail);
});

window.addEventListener("MessageSent", event => {
	reconnectIfNeeded()
	sendActionToWebsocket('display_message_delivered_on_chat', event.detail);
});

window.addEventListener("NewMessageArrived", event => {
	reconnectIfNeeded()

	const message = {
		...event.detail,
		direction: 'outbound',
		status: 'delivered',
	};
	sendActionToWebsocket('display_message_delivered_on_chat', message);
});

//esse content.js é executado isolado da página e por isso tem acesso à api do chrome extension, como chrome.rintme
