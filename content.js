window.removeEventListener("WhatsappWebConnected", () => { });
window.removeEventListener("WhatsappWebDisconnected", () => { });
window.removeEventListener("ConversationReceived", () => { });
window.removeEventListener("MessageSent", () => { });
window.removeEventListener("NewMessageArrived", () => { });

// Pop-up listeners
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
	userToken = request.userToken;
	clientUserId = request.clientUserId;

	if (userToken && clientUserId) {
		setStorage("UserKey", userToken);
		setStorage("ClientUserId", clientUserId);
		disconnect()
		connect()

		chrome.runtime.sendMessage("WhatsappWebConnected");
	}
})

window.addEventListener("WhatsappWebDisconnected", () => {
	chrome.runtime.sendMessage("WhatsappWebDisconnected");
});

// Whatsapp event listeners
window.addEventListener("ConversationReceived", event => {
	console.log("[Event Listener Added] ConversationReceived", event.detail)
	sendActionToWebsocket('display_conversation_on_chat', event.detail);
});

window.addEventListener("MessageSent", event => {
	console.log("[Event Listener Added] Event Sent")
	sendActionToWebsocket('display_message_delivered_on_chat', event.detail);
});

window.addEventListener("NewMessageArrived", event => {
	console.log("[Event Listener Added] New Message Arrived")
	const message = {
		...event.detail,
		direction: 'outbound',
		status: 'delivered',
	};

	sendActionToWebsocket('display_message_delivered_on_chat', message);
});

window.onbeforeunload = () => {
	console.log("[Event Listener Added] Trying to Disconect")
	disconnect();
	chrome.runtime.sendMessage("WhatsappWebDisconnected");
};
