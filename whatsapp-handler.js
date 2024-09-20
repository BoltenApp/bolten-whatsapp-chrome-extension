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

	const buildMsgPayload = (msg, senderNumber = '', profilePicUrl = undefined) => {
		const profilePicThumb = msg.__x_senderObj?.__x_profilePicThumb?.__x_imgFull || profilePicUrl;

		return {
			id: msg.__x_id?.id,
			rowId: msg.__x_rowId,
			body: msg.__x_body,
			from: msg.__x_from?.user,
			to: msg.__x_to?.user,
			type: msg.__x_type,
			direction: msg.__x_from?.user == senderNumber ? 'outbound' : 'inbound',
			senderName: msg.__x_senderObj?.pushname,
			senderShortName: msg.__x_senderObj?.shortName,
			profilePicThumb: profilePicThumb,
			quotedMsg: msg.__x_quotedMsg?.body,
			timestamp: new Date(msg.__x_t * 1000),
		}
	}

	WPP.on('chat.new_message', async (msg) => {
		if (isGroupMessage(msg) || isE2ENotification(msg)) return;

		const senderNumber = msg.__x_from.user
		const profilePicUrl = await WPP.contact.getProfilePictureUrl(`${senderNumber}@c.us`);

		window.dispatchEvent(new CustomEvent("NewMessageArrived", {
			detail: buildMsgPayload(msg, '', profilePicUrl)
		}));
	});

	window.addEventListener("ConversationRequested", async event => {
		const messagesToBeShown = []
		const formattedPersonNumber = event.detail.recipientNumber.slice(1, event.detail.recipientNumber.length);
		const messageLimit = event.detail.messageLimit;
		const messages = await WPP.chat.getMessages(formattedPersonNumber, { count: messageLimit });
		const profilePicUrl = await WPP.contact.getProfilePictureUrl(`${formattedPersonNumber}@c.us`);
		messages.forEach(msg => {
			if(isE2ENotification(msg)) return
			messagesToBeShown.push(buildMsgPayload(msg, formattedPersonNumber, profilePicUrl))
		})
		const another = messages.map(msg => {
			return buildMsgPayload(msg, formattedPersonNumber, profilePicUrl)
		})

		console.log("Estou lhe mostrano ANOTHER", another == messagesToBeShown)

		window.dispatchEvent(new CustomEvent("ConversationReceived", {
			detail: another
		}));
		window.dispatchEvent(new CustomEvent("ConversationReceived", {
			detail: messagesToBeShown
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
})();
