
function connect() {
	webSocket = new WebSocket('wss://equipped-concise-owl.ngrok-free.app/cable');

	webSocket.onopen = (event) => {
		console.log('websocket open');
		// keepAlive();

		const msg = {
			command: 'subscribe',
			identifier: JSON.stringify({
				id: 'xpto',
				channel: 'RoomChannel'
			}),
		};

		webSocket.send(JSON.stringify(msg));
	};

	webSocket.onmessage = (event) => {
		console.log(`websocket received message: ${event.data}`);
		message = JSON.parse(event.data).message;

		if (message) {
			switch (message.action) {
				case 'fetch_conversation':
					console.log(`[WS] Fetching conversation from ${message}`);
					window.dispatchEvent(new CustomEvent("ConversationRequested", {
						detail: {
							senderNumber: message.sender_number,
							recipientNumber: message.recipient_number,
							messageLimit: message.message_listing_limit,
						}
					}))
					break;
				case 'send_message_wpp_web':
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

function keepAlive() {
	const keepAliveIntervalId = setInterval(
		() => {
			if (webSocket) {
				webSocket.send('keepalive');
			} else {
				clearInterval(keepAliveIntervalId);
			}
		},
		// Set the interval to 20 seconds to prevent the service worker from becoming inactive.
		15 * 1000
	);
}

connect()

window.addEventListener("ConversationReceived", event => {
	if (webSocket == null) {
		connect();
	}

	console.log("ConversationReceived")

	const toSend = {
		command: 'message',
		data: JSON.stringify({
			action: 'display_conversation',
			body: JSON.stringify(event.detail)
		}),
		identifier: JSON.stringify({
			id: 'xpto',
			channel: 'RoomChannel'
		}),
	};

	webSocket.send(JSON.stringify(toSend));
});

window.addEventListener("MessageSent", event => {
	if (webSocket == null) {
		connect();
	}

	console.log("MessageSent")

	const toSend = {
		command: 'message',
		data: JSON.stringify({
			action: 'notify_message_sent',
			body: JSON.stringify(event.detail)
		}),
		identifier: JSON.stringify({
			id: 'xpto',
			channel: 'RoomChannel'
		}),
	};

	webSocket.send(JSON.stringify(toSend));
});

window.addEventListener("NewMessageArrived", event => {
	const msg = {
		...event.detail,
		direction: 'outbound',
		status: 'delivered',
	}

	// if (msg.from === '5515997393918') {
	if (true) {
		if (webSocket == null) {
			connect();
		}

		const toSend = {
			command: 'message',
			data: JSON.stringify({
				action: 'display_received_message',
				body: JSON.stringify(msg)
			}),
			identifier: JSON.stringify({
				id: 'xpto',
				channel: 'RoomChannel'
			}),
		};

		webSocket.send(JSON.stringify(toSend));
	} else {
		console.log("Skipped message: ", msg);
	}
	// fetch("https://jsonplaceholder.typicode.com/todos", {
	// 	method: "POST",
	// 	body: JSON.stringify(event.msg),
	// 	headers: {
	// 		"Content-type": "application/json; charset=UTF-8"
	// 	}
	// }).then((response) => response.json())
	// 	.then((json) => console.log(json));
	// console.log("from extension: " + event.detail);
});

//esse content.js é executado isolado da página e por isso tem acesso à api do chrome extension, como chrome.rintme
