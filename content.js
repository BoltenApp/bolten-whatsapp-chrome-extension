window.removeEventListener("WhatsappWebConnected", () => { });
window.removeEventListener("WhatsappWebDisconnected", () => { });
window.removeEventListener("ConversationReceived", () => { });
window.removeEventListener("MessageSent", () => { });
window.removeEventListener("NewMessageArrived", () => { });

const popUpEventHandlers = {
	"CookiesSetRequested": handleCookieSetRequested,
	"CurrentContactRequested": handleCurrentContactRequested
}

// Pop-up event listener
chrome.runtime.onMessage.addListener(async (request, _sender, _sendResponse) => {
	if (request.type && popUpEventHandlers[request.type]) {
		console.log("Handling message from Pop-Up: ", request);
		popUpEventHandlers[request.type](request.data);
	}
})

function handleCookieSetRequested(data) {
	userToken = data.userToken;
	clientUserId = data.clientUserId;

	if (userToken && clientUserId) {
		setStorage("UserKey", userToken);
		setStorage("ClientUserId", clientUserId);

		connect().then(() => {
			chrome.runtime.sendMessage("WhatsappWebConnected");
		});
	}
}

function handleCurrentContactRequested(_data) {
	window.dispatchEvent(new CustomEvent("FetchCurrentContact"));
}

window.addEventListener("WhatsappWebDisconnected", () => {
	chrome.runtime.sendMessage("WhatsappWebDisconnected");
});

// Whatsapp event listeners
window.addEventListener("ConversationReceived", event => {
	console.log("[Event Listener Added] ConversationReceived")
	sendActionToWebsocket('display_conversation_on_chat', event.detail);
});

window.addEventListener("MessageSent", event => {
	console.log("[Event Listener Added] Event Sent")
});

window.addEventListener("NewMessageArrived", event => {
	console.log("[Event Listener Added] New Message Arrived")
	const message = {
		...event.detail,
		status: 'delivered',
	};

	const action = event.detail.direction == 'outbound' ? 'display_message_delivered_on_chat' : 'display_message_received_on_chat';

	sendActionToWebsocket(action, message);
});

window.addEventListener("CurrentContactFetched", event => {
	console.log("[Event Listener Added] CurrentContactFetched", event)

	chrome.runtime.sendMessage({
		data: {
			type: "CurrentContactReceived",
			contact: event.detail
		}
	});
})

window.onbeforeunload = () => {
	console.log("[Event Listener Added] Disconecting from WPP Web")

	disconnect();
	chrome.runtime.sendMessage("WhatsappWebDisconnected");
};
