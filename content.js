// Listen for messages from popup.
function connect() {
	if (!cookieExists("ClientUserId")) {
		console.log("ClientUserId cookie not found");
		return;
	}

	webSocket = new WebSocket('wss://equipped-concise-owl.ngrok-free.app/cable');

	webSocket.onopen = (event) => {
		const subscribeCommand = {
			command: 'subscribe',
			identifier: JSON.stringify({
				id: getCookie('ClientUserId'),
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
			id: getCookie('ClientUserId'),
			channel: 'ChatApp::WhatsappWebClientUserChannel'
		}),
	};

	webSocket.send(JSON.stringify(payload));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	userToken = request.userToken;
	clientUserId = request.clientUserId;

	console.log("SETANO O CUQIEEE")
	console.log(userToken, clientUserId)

	if (userToken && clientUserId) {
		setCookie("UserKey", userToken, 7);
		setCookie("ClientUserId", clientUserId, 7);
		connect()
	}
})

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
