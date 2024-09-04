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
			detail: buildMsgPayload(msg)
		}));
	});

	WPP.on('chat.active_chat', (chat) => {
		console.log(chat)
		// Abrir janela Bolten com contato Bolten
	});


	buildMsgPayload = (msg, senderNumber = '') => {
		return {
			id: msg.__x_id?.id,
			rowId: msg.__x_rowId,
			body: msg.__x_body,
			from: msg.__x_from?.user,
			to: msg.__x_to?.user,
			type: msg.__x_type,
			direction: msg.__x_from == senderNumber ? 'outbound' : 'inbound',
			senderName: msg.__x_senderObj?.pushname,
			senderShortName: msg.__x_senderObj?.shortName,
			profilePicThumb: msg.__x_senderObj?.__x_profilePicThumb?.__x_imgFull,
			timestamp: new Date(msg.__x_t * 1000),
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

	window.addEventListener("ConversationRequested", async event => {
		// console.log(`ConversationRequested: ${event.detail}`);
		const formattedSenderNumber = event.detail.senderNumber.slice(1, event.detail.senderNumber.length);
		const messageLimit = event.detail.messageLimit;
		const messages = await WPP.chat.getMessages(formattedSenderNumber, { count: messageLimit });
		const formattedMessages = messages.map(msg => {
			return buildMsgPayload(msg, formattedSenderNumber);
		})

		window.dispatchEvent(new CustomEvent("ConversationReceived", {
			detail: formattedMessages
		}));
	})
	window.addEventListener("MessageDispatchRequested", async event => {
		// console.log(`ConversationRequested: ${event.detail}`);
		const formattedRecipientNumber = event.detail.recipientNumber.slice(1, event.detail.recipientNumber.length);
		const message = await WPP.chat.sendTextMessage(formattedRecipientNumber, event.detail.message, { createChat: true });

		window.dispatchEvent(new CustomEvent("MessageSent", {
			detail: {
				// id: message.id,
				id: event.detail.externalId,
				direction: 'inbound',
				from: message.from.split("@")[0],
				to: message.to.split("@")[0],
				senderName: 'You',
				timestamp: new Date(),
			}
		}));
	})
})();
