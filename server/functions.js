function sendMessage(participant, message) {
	if (participant.send) {
		// WebSocket client
		participant.send(message);
	} else if (participant.write) {
		// TCP socket
		participant.write(message);
	}
}

function sendTieMessageToParticipants(roomId, participants) {
	participants.forEach((participant) => {
		const targetId = participant.id;

		if (
			gameRooms[roomId][0].id === targetId ||
			gameRooms[roomId][1].id === targetId
		) {
			const message = JSON.stringify({ type: "tie" });

			sendMessage(participant, message);
		}
	});
}

function sendWinnerMessageToParticipants(player, otherPlayer, participants) {
	participants.forEach((participant) => {
		const isWinner = participant.id === player.id;
		const message = JSON.stringify({
			type: "winnerDetermined",
			data: {
				youWon: isWinner,
				winningLetter: player.letter,
			},
		});

		sendMessage(participant, message);
	});
}

module.exports = {
	sendTieMessageToParticipants,
	sendWinnerMessageToParticipants,
};
