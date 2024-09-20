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

		connect().then(() => {
			chrome.runtime.sendMessage("WhatsappWebConnected");
		});
	}
})

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

window.onbeforeunload = () => {
	console.log("[Event Listener Added] Disconecting from WPP Web")

	disconnect();
	chrome.runtime.sendMessage("WhatsappWebDisconnected");
};
