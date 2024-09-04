(async () => {
	await new Promise(r => {
		const interval = setInterval(() => {
			if (WPP.isFullReady) {
				clearInterval(interval);
				r();
			}
		}
		);
	});

	function isGroupMessage(msg) {
		console.log(`Is Group Message: ${msg.__x_author.user !== msg.__x_from.user}`)
		return msg.__x_author.user !== msg.__x_from.user;
	}

	WPP.on('chat.new_message', async (msg) => {
		if (isGroupMessage(msg)) return;

		const senderNumber = msg.__x_author.user
		const profilePicUrl = await WPP.contact.getProfilePictureUrl(`${senderNumber}@c.us`);

		window.dispatchEvent(new CustomEvent("NewMessageArrived", {
			detail: buildMsgPayload(msg, '', profilePicUrl)
		}));
	});

	WPP.on('chat.active_chat', (chat) => {
		// console.log(chat)
	});


	buildMsgPayload = (msg, senderNumber = '', profilePicUrl = undefined) => {
		console.log(msg)
		const profilePicThumb = msg.__x_senderObj?.__x_profilePicThumb?.__x_imgFull || profilePicUrl;

		return {
			id: msg.__x_id?.id,
			rowId: msg.__x_rowId,
			body: msg.__x_body,
			from: msg.__x_author?.user,
			to: msg.__x_to?.user,
			type: msg.__x_type,
			direction: msg.__x_author?.user == senderNumber ? 'outbound' : 'inbound',
			senderName: msg.__x_senderObj?.pushname,
			senderShortName: msg.__x_senderObj?.shortName,
			profilePicThumb: profilePicThumb,
			quotedMsg: msg.__x_quotedMsg?.body,
			timestamp: new Date(msg.__x_t * 1000),
		}
	}

	window.addEventListener("ConversationRequested", async event => {
		const formattedPersonNumber = event.detail.recipientNumber.slice(1, event.detail.recipientNumber.length);
		const messageLimit = event.detail.messageLimit;
		const messages = await WPP.chat.getMessages(formattedPersonNumber, { count: messageLimit });
		const profilePicUrl = await WPP.contact.getProfilePictureUrl(`${formattedPersonNumber}@c.us`);
		const formattedMessages = messages.map(msg => {
			return buildMsgPayload(msg, formattedPersonNumber, profilePicUrl);
		})

		window.dispatchEvent(new CustomEvent("ConversationReceived", {
			detail: formattedMessages
		}));
	})
	window.addEventListener("MessageDispatchRequested", async event => {
		const formattedRecipientNumber = event.detail.recipientNumber.slice(1, event.detail.recipientNumber.length);
		const message = await WPP.chat.sendTextMessage(formattedRecipientNumber, event.detail.message, { createChat: true });

		window.dispatchEvent(new CustomEvent("MessageSent", {
			detail: {
				dispatchId: message.id,
				id: event.detail.externalId,
				direction: 'inbound',
				from: message.from.split("@")[0],
				to: message.to.split("@")[0],
				senderName: 'You',
				timestamp: new Date(),
			}
		}));
	})

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
})();
