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

	window.removeEventListener("MessageDispatchRequested", () => { });
	window.removeEventListener("ConversationRequested", () => { });

	const isGroupMessage = (msg) => {
		return !!msg.__x_author?.user;
	}

	const isE2ENotification = (msg) => {
		return msg.__x_type == "e2e_notification";
	}

	const buildMsgPayload = (msg, profilePicUrl = undefined) => {
		const profilePicThumb = msg.__x_senderObj?.__x_profilePicThumb?.__x_imgFull || profilePicUrl;
		// 	direction = msg.__x_from?.user == senderNumber ? 'outbound' : 'inbound'

		return {
			id: msg.__x_id?.id,
			rowId: msg.__x_rowId,
			body: msg.__x_body,
			from: msg.__x_from?.user,
			to: msg.__x_to?.user,
			type: msg.__x_type,
			direction: msg.__x_id?.fromMe ? 'outbound' : 'inbound',
			senderName: msg.__x_senderObj?.pushname,
			senderShortName: msg.__x_senderObj?.shortName,
			profilePicThumb: profilePicThumb,
			quotedMsg: msg.__x_quotedMsg?.body,
			timestamp: new Date(msg.__x_t * 1000),
		}
	}

	const buildPersonPayloadFromChat = (chat, profilePicUrl = undefined) => {
		const profilePicThumb = chat.__x_profilePicThumb?.__x_imgFull || profilePicUrl;

		return {
			senderName: chat.__x_formattedTitle,
			senderNumber: chat.__x_id.user,
			senderId: chat.__x_id._serialized,
			profilePicThumb: profilePicThumb,
		}
	}

	WPP.on('chat.new_message', async (msg) => {
		if (isGroupMessage(msg) || isE2ENotification(msg)) return;

		console.log("NEW MESSAGE")

		const senderNumber = msg.__x_from.user
		const profilePicUrl = await WPP.contact.getProfilePictureUrl(`${senderNumber}@c.us`);

		window.dispatchEvent(new CustomEvent("NewMessageArrived", {
			detail: buildMsgPayload(msg, profilePicUrl)
		}));
	});

	WPP.on('chat.active_chat', async (chat) => {
		if (!chat.__x_isUser) return;

		console.log("ACTIVE CHAT")

		// const senderName = chat.__x_formattedTitle
		// const senderNumber = chat.__x_id.user
		// const senderId = chat.__x_id._serialized
		const profilePicUrl = await WPP.contact.getProfilePictureUrl(chat.__x_id._serialized);

		// console.log("Sender number", senderNumber);
		// console.log("Sender number", senderId);
		// console.log("Profile Pic URL", profilePicUrl);

		const payload = buildPersonPayloadFromChat(chat, profilePicUrl)
		console.log("Payload", payload);

		window.dispatchEvent(new CustomEvent("ChatWindowFocused", {
			detail: buildPersonPayloadFromChat(chat, profilePicUrl)
		}));
	});

	window.addEventListener("ConversationRequested", async event => {
		const formattedPersonNumber = event.detail.recipientNumber.slice(1, event.detail.recipientNumber.length);
		const messageLimit = event.detail.messageLimit;
		const messages = await WPP.chat.getMessages(formattedPersonNumber, { count: messageLimit });
		const profilePicUrl = await WPP.contact.getProfilePictureUrl(`${formattedPersonNumber}@c.us`);
		const messagesToBeShown = messages.map(msg => {
			return buildMsgPayload(msg, profilePicUrl)
		})

		window.dispatchEvent(new CustomEvent("ConversationReceived", {
			detail: messagesToBeShown
		}));
	})

	window.addEventListener("MessageDispatchRequested", async event => {
		const formattedRecipientNumber = event.detail.recipientNumber.slice(1, event.detail.recipientNumber.length);
		await WPP.chat.sendTextMessage(formattedRecipientNumber, event.detail.message, { createChat: true });
	})
})();
