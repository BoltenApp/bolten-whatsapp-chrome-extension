(async () => {
	//todo código dentro de um escopo pra não conflitar com possíveis variáveis definidas na página do zap

	//espera WPP estar pronta pra usar
	await new Promise(r => {
		const interval = setInterval(() => {
			if (WPP.isFullReady) {
				clearInterval(interval);
				r();
			}
		});
	});

	//usa WPP
	const myProfileName = WPP.profile.getMyProfileName();
	console.log("from script: " + myProfileName);

	WPP.on('chat.new_message', (msg) => {
		window.dispatchEvent(new CustomEvent("NewMessageArrived", {
			detail: {
				body: msg.__x_body,
				from: msg.__x_from.user,
				to: msg.__x_to.user,
				type: msg.__x_type,
				senderName: msg.__x_senderObj.pushname,
				senderShortName: msg.__x_senderObj.shortName,
			}
		}));
	});

	WPP.on('chat.active_chat', (chat) => {
		console.log(chat)
		// Abrir janela Bolten com contato Bolten
	});


	buildMsgPayload = (msg) => {
		return {
			body: msg.__x_body,
			from: msg.__x_from.user,
			to: msg.__x_to.user,
			type: msg.__x_type,
			senderName: msg.__x_senderObj.pushname,
			senderShortName: msg.__x_senderObj.shortName,
			// quotedMsg: msg.__x_quotedMsg,
		}
	}

	// // List only chats with users
	// chats = await WPP.chat.list({ onlyUsers: true });
	// numberData = []
	// for (chat of chats) {
	// 	numberData.push([chat.__x_id.user, chat.__x_id._serialized])
	// }
	// contactData = {}

	// numberData.forEach(async (nd) => {
	// 	c = (await WPP.chat.getMessages(nd[1], { count: 80 }))

	// 	msgs = c.map(msg => {
	// 		return buildMsgPayload(msg)
	// 	});

	// 	contactData[nd[1]] = msgs
	// 	console.log(msgs)
	// });

	window.dispatchEvent(new CustomEvent("MyCustomEvent", { detail: myProfileName }));
	window.addEventListener("ConversationRequested", async event => {
		console.log(`ConversationRequested: ${event.detail}`);
		const formattedSenderNumber = event.detail.senderNumber.slice(1, event.detail.senderNumber.length);
		const messageLimit = event.detail.messageLimit;
		const messages = await WPP.chat.getMessages(formattedSenderNumber, { count: messageLimit });
		const formattedMessages = messages.map(msg => {
			return buildMsgPayload(msg);
		})

		window.dispatchEvent(new CustomEvent("ConversationReceived", {
			detail: formattedMessages
		}));
	})
})();
