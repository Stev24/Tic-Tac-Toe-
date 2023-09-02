const {
	findOtherPlayer,
	getOtherPlayer,
	findPlayerRoom,
	randomizePlayerTurn,
	initStartValues,
} = require("./game");

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

function sendPlayedMoveToParticipants(
	movePlayed,
	otherPlayer,
	participants,
	info
) {
	participants.forEach((participant) => {
		if (participant.id === otherPlayer.id) {
			sendMessage(
				participant,
				JSON.stringify({ type: "yourTurn", data: info })
			);
		}
		if (participant.id === movePlayed.player.id) {
			sendMessage(participant, JSON.stringify({ type: "otherTurn" }));
		}
	});
}

function restartGame(gameRooms, roomId, playerData, participants) {
	participants.forEach((participant) => {
		if (participant.id === gameRooms[roomId][0].id) {
			sendMessage(
				participant,
				JSON.stringify({ type: "gameRestarted", data: playerData[0] })
			);
		}
		if (participant.id === gameRooms[roomId][1].id) {
			sendMessage(
				participant,
				JSON.stringify({ type: "gameRestarted", data: playerData[1] })
			);
		}
	});
}

function sendDisconnectMessage(participants, otherPlayer) {
	participants.forEach((participant) => {
		if (participant.id === otherPlayer.id) {
			sendMessage(
				participant,
				JSON.stringify({ type: "playerDisconnect" })
			);
		}
	});
}

function gameStart(participants) {
	participants.forEach(function (participant) {
		sendMessage(participant, JSON.stringify({ type: "gameStart" }));
	});
}

function gameStartWithGameRoom(participants, gameRooms, gameRoomId) {
	participants.forEach(function (participant) {
		if (
			participant.id === gameRooms[gameRoomId][0].id ||
			participant.id === gameRooms[gameRoomId][1].id
		) {
			sendMessage(participant, JSON.stringify({ type: "gameStart" }));
		}
	});
}

function chooseGameType(
	gameType,
	randomGame,
	gameRooms,
	socket,
	sockets,
	wss,
	gameQuery = null
) {
	if (gameType == "random") {
		const joinInfo = {
			id: socket.id,
			roomId: randomGame.roomId,
			playerNumber: randomGame.usersOn,
			letter: randomGame.letters[randomGame.usersOn - 1],
			turn: randomGame.turn[randomGame.usersOn - 1],
			roomType: "random",
		};

		randomGame.playerData.push(joinInfo);

		randomGame.usersOn++;

		sendMessage(
			socket,
			JSON.stringify({ type: "playersJoined", data: joinInfo })
		);

		if (randomGame.usersOn > 2) {
			gameRooms[randomGame.roomId] = randomGame.playerData;

			gameStart(sockets);
			gameStart(wss.clients);

			randomGame = initStartValues();
		}
	} else if (gameType == "createPrivate") {
		const privateGame = initStartValues();
		const joinInfo = {
			id: socket.id,
			roomId: privateGame.roomId,
			playerNumber: privateGame.usersOn,
			letter: privateGame.letters[privateGame.usersOn - 1],
			turn: privateGame.turn[privateGame.usersOn - 1],
			roomType: "private",
			gameValues: privateGame,
		};
		sendMessage(
			socket,
			JSON.stringify({ type: "playersJoined", data: joinInfo })
		);

		gameRooms[privateGame.roomId] = [joinInfo];
	} else if (gameType == "gameCode") {
		const gameRoomId = Number(gameQuery.gameCode);
		if (gameRooms[gameRoomId] == undefined) {
			sendMessage(
				socket,
				JSON.stringify({ type: "gameNotExist", data: gameRoomId })
			);
		} else {
			const gameValues = gameRooms[gameRoomId][0].gameValues;

			gameValues.usersOn++;

			const joinInfo = {
				id: socket.id,
				roomId: gameValues.roomId,
				playerNumber: gameValues.usersOn,
				letter: gameValues.letters[gameValues.usersOn - 1],
				turn: gameValues.turn[gameValues.usersOn - 1],
				roomType: "private",
			};

			gameRooms[gameRoomId].push(joinInfo);

			sendMessage(
				socket,
				JSON.stringify({ type: "playersJoined", data: joinInfo })
			);

			gameStartWithGameRoom(wss.clients, gameRooms, gameRoomId);
			gameStartWithGameRoom(sockets, gameRooms, gameRoomId);
		}
	}

	return {
		randomGame,
		gameRooms,
	};
}

function gameHandler(message, wss, sockets, gameRooms) {
	if (message.type === "winner") {
		const player = message.data;
		var otherPlayer = getOtherPlayer(player, gameRooms);

		sendWinnerMessageToParticipants(player, otherPlayer, sockets);
		sendWinnerMessageToParticipants(player, otherPlayer, wss.clients);
	}

	if (message.type === "tie") {
		const roomId = message.data;

		sendTieMessageToParticipants(roomId, wss.clients);
		sendTieMessageToParticipants(roomId, sockets);
	}

	if (message.type === "playedMove") {
		const movePlayed = message.data;
		var otherPlayer = getOtherPlayer(movePlayed.player, gameRooms);

		info = {
			boxPlayed: movePlayed.box,
			letter: movePlayed.player.letter,
		};

		sendPlayedMoveToParticipants(
			movePlayed,
			otherPlayer,
			wss.clients,
			info
		);
		sendPlayedMoveToParticipants(movePlayed, otherPlayer, sockets, info);
	}

	if (message.type === "restartGame") {
		const roomId = message.data;

		playersRematch++;
		if (playersRematch == 2) {
			newPlayerData = randomizePlayerTurn(gameRooms[roomId]);

			restartGame(gameRooms, roomId, newPlayerData, wss.clients);
			restartGame(gameRooms, roomId, newPlayerData, sockets);

			playersRematch = 0;
		}
	}
}

function disconnectionHandler(socket, gameRooms, wss, sockets) {
	const roomId = findPlayerRoom(socket.id, gameRooms);

	if (!roomId) {
		// if no rooms means no players .
		randomGame = initStartValues();
	} else if (!(gameRooms[roomId] == undefined)) {
		// we have room and is defined
		// if player has room
		if (!(gameRooms[roomId].length == 1)) {
			// more than one player means 2 players
			var otherPlayerInfo = findOtherPlayer(socket.id, gameRooms);

			if (otherPlayerInfo != null) {
				var otherPlayer = getOtherPlayer(otherPlayerInfo, gameRooms);
				if (otherPlayer) {
					sendDisconnectMessage(wss.clients, otherPlayer);
					sendDisconnectMessage(sockets, otherPlayer);
				}
			}
		}
	}
}

module.exports = {
	sendTieMessageToParticipants,
	sendWinnerMessageToParticipants,
	sendPlayedMoveToParticipants,
	restartGame,
	sendDisconnectMessage,
	gameStart,
	gameStartWithGameRoom,
	chooseGameType,
	gameHandler,
	disconnectionHandler,
};
