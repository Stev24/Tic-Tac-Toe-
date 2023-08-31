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

function sendPlayedMoveToParticipants(movePlayed, otherPlayer, participants, info) {
	participants.forEach((participant) => {
        if (participant.id === otherPlayer.id) {
            sendMessage(participant, JSON.stringify({ type: "yourTurn", data: info }))
        }
        if (participant.id === movePlayed.player.id) {
            sendMessage(participant, JSON.stringify({ type: "otherTurn" }));
        }
	});
}

function restartGame(gameRooms, roomId, playerData, participants) {
    participants.forEach(participant => {
      if (participant.id === gameRooms[roomId][0].id) {
        sendMessage(participant, JSON.stringify({ type: "gameRestarted", data: playerData[0] }));
      }
      if (participant.id === gameRooms[roomId][1].id) {
        sendMessage(participant, JSON.stringify({ type: "gameRestarted", data: playerData[1] }));
      }
    });
}

function sendDisconnectMessage(participants, otherPlayer) {
    participants.forEach((participant) => {
        if (participant.id === otherPlayer.id) {
            sendMessage(participant, JSON.stringify({ type: "playerDisconnect" }));
        }
    });
}

module.exports = {
	sendTieMessageToParticipants,
	sendWinnerMessageToParticipants,
    sendPlayedMoveToParticipants,
    restartGame,
    sendDisconnectMessage
};
