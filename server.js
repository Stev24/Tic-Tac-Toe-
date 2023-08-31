const {
	getRandomInt,
	findOtherPlayer,
	getOtherPlayer,
	findPlayerRoom,
	randomizePlayerTurn,
	initStartValues,
	removePlayerFromRoom,
} = require("./server/game");

const {
	sendTieMessageToParticipants,
	sendWinnerMessageToParticipants,
	sendPlayedMoveToParticipants,
	restartGame,
	sendDisconnectMessage,
	gameStart,
	gameStartWithGameRoom
} = require("./server/functions");

const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const server = http.createServer();

const publicPath = path.join(__dirname, "public");

var gameType;
function getGameType(gameQuery) {
	for (key in gameQuery) {
		gameType = key.toString();
	}
}

var gameQuery;

server.on("request", (req, res) => {
	const url = req.url;
	if (url.startsWith("/join")) {
		const joinPath = path.join(__dirname, "views", "join.html");
		fs.readFile(joinPath, "utf-8", (err, data) => {
			if (err) {
				res.writeHead(500);
				res.end("Internal Server Error");
			} else {
				res.writeHead(200, { "Content-Type": "text/html" });
				res.end(data);
			}
		});
	} else if (url.startsWith("/game")) {
		gameQuery = require("url").parse(url, true).query;
		getGameType(gameQuery);
		const gamePath = path.join(__dirname, "views", "game.html");
		fs.readFile(gamePath, "utf-8", (err, data) => {
			if (err) {
				res.writeHead(500);
				res.end("Internal Server Error");
			} else {
				res.writeHead(200, { "Content-Type": "text/html" });
				res.end(data);
			}
		});
	} else if (url === "/") {
		const indexPath = path.join(__dirname, "views", "index.html");
		fs.readFile(indexPath, "utf-8", (err, data) => {
			if (err) {
				res.writeHead(500);
				res.end("Internal Server Error");
			} else {
				res.writeHead(200, { "Content-Type": "text/html" });
				res.end(data);
			}
		});
	} else {
		const filePath = path.join(publicPath, url);
		fs.readFile(filePath, (err, data) => {
			if (err) {
				res.writeHead(404);
				res.end("Not Found");
			} else {
				const contentType = getContentType(filePath);
				res.writeHead(200, { "Content-Type": contentType });
				res.end(data);
			}
		});
	}
});

function getContentType(filePath) {
	const extname = path.extname(filePath);
	switch (extname) {
		case ".js":
			return "text/javascript";
		case ".css":
			return "text/css";
		case ".html":
			return "text/html";
		default:
			return "application/octet-stream";
	}
}

randomGame = initStartValues();

gameRooms = {};

const wss = new WebSocket.Server({ server });

wss.on("connection", function (socket) {
	socket.id = getRandomInt(1, 1000);
	if (gameType == "random") {
		var joinInfo = {
			id: socket.id,
			roomId: randomGame.roomId,
			playerNumber: randomGame.usersOn,
			letter: randomGame.letters[randomGame.usersOn - 1],
			turn: randomGame.turn[randomGame.usersOn - 1],
			roomType: "random",
		};

		randomGame.playerData.push(joinInfo);

		randomGame.usersOn++;

		socket.send(JSON.stringify({ type: "playersJoined", data: joinInfo }));

		if (randomGame.usersOn > 2) {
			gameRooms[randomGame.roomId] = randomGame.playerData;

			gameStart(sockets);
			gameStart(wss.clients);

			randomGame = initStartValues();
		}
	} else if (gameType == "createPrivate") {
		var privateGame = initStartValues();
		var joinInfo = {
			id: socket.id,
			roomId: privateGame.roomId,
			playerNumber: privateGame.usersOn,
			letter: privateGame.letters[privateGame.usersOn - 1],
			turn: privateGame.turn[privateGame.usersOn - 1],
			roomType: "private",
			gameValues: privateGame,
		};
		socket.send(JSON.stringify({ type: "playersJoined", data: joinInfo }));

		gameRooms[privateGame.roomId] = [joinInfo];
	} else if (gameType == "gameCode") {
		var gameRoomId = Number(gameQuery.gameCode);
		if (gameRooms[gameRoomId] == undefined) {
			socket.send(
				JSON.stringify({ type: "gameNotExist", data: gameRoomId })
			);
		} else {
			var gameValues = gameRooms[gameRoomId][0].gameValues;

			gameValues.usersOn++;

			var joinInfo = {
				id: socket.id,
				roomId: gameValues.roomId,
				playerNumber: gameValues.usersOn,
				letter: gameValues.letters[gameValues.usersOn - 1],
				turn: gameValues.turn[gameValues.usersOn - 1],
				roomType: "private",
			};

			gameRooms[gameRoomId].push(joinInfo);

			socket.send(
				JSON.stringify({ type: "playersJoined", data: joinInfo })
			);

			gameStartWithGameRoom(wss.clients, gameRooms, gameRoomId);
			gameStartWithGameRoom(sockets, gameRooms, gameRoomId);

		}
	}

	playersRematch = 0;

	socket.addEventListener("message", (event) => {
		const message = JSON.parse(event.data);

		if (message.type === "winner") {
			const player = message.data;
			var otherPlayer = getOtherPlayer(player);

			sendWinnerMessageToParticipants(player, otherPlayer, sockets);
			//send to WEB client with websockets
			sendWinnerMessageToParticipants(player, otherPlayer, wss.clients);
		}

		if (message.type === "tie") {
			const roomId = message.data;

			sendTieMessageToParticipants(roomId, wss.clients);
			sendTieMessageToParticipants(roomId, sockets);
		}

		if (message.type === "playedMove") {
			const movePlayed = message.data;
			var otherPlayer = getOtherPlayer(movePlayed.player);

			var playerRoom = movePlayed.player.roomId;

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
			sendPlayedMoveToParticipants(
				movePlayed,
				otherPlayer,
				sockets,
				info
			);
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
	});

	socket.addEventListener("close", function () {
		// Code to handle the disconnect event
		removePlayerFromRoom(socket.id);

		//This means the player is alone as he does not have a room
		if (!findPlayerRoom(socket.id)) {
			randomGame = initStartValues();
		} else if (!(gameRooms[findPlayerRoom(socket.id)] == undefined)) {
			if (!(gameRooms[findPlayerRoom(socket.id)].length == 1)) {
				var otherPlayerInfo = findOtherPlayer(socket.id);

				if (otherPlayerInfo != null) {
					var otherPlayer = getOtherPlayer(otherPlayerInfo);
					if (otherPlayer) {
						sendDisconnectMessage(wss.clients, otherPlayer);
						sendDisconnectMessage(sockets, otherPlayer);
					}
				}
			}
		}
	});
});

const PORT = 3000;
server.listen(PORT, () => {
	console.log(`Server is listening on port ${PORT}`);
});

/// TCP Server

const net = require("net");
const port = 7070;
const host = "127.0.0.1";

const serverTCP = net.createServer();
serverTCP.listen(port, host, () => {
	console.log("TCP Server is running on port " + port + ".");
});

let sockets = [];

serverTCP.on("connection", function (sock) {
	sock.id = getRandomInt(1, 1000);
	console.log("CONNECTED: " + sock.remoteAddress + ":" + sock.remotePort);
	sockets.push(sock);

	playersRematch = 0;

	sock.on("data", function (data) {
		if (data == "random") {

			var joinInfo = {
				id: sock.id,
				roomId: randomGame.roomId,
				playerNumber: randomGame.usersOn,
				letter: randomGame.letters[randomGame.usersOn - 1],
				turn: randomGame.turn[randomGame.usersOn - 1],
				roomType: "random",
			};

			randomGame.playerData.push(joinInfo);

			randomGame.usersOn++;

			sock.write(
				JSON.stringify({ type: "playersJoined", data: joinInfo })
			);

			if (randomGame.usersOn > 2) {
				gameRooms[randomGame.roomId] = randomGame.playerData;

				gameStart(sockets);
				gameStart(wss.clients);

				randomGame = initStartValues();
			}
		} else if (data == "createPrivate") {
			var privateGame = initStartValues();
			var joinInfo = {
				id: sock.id,
				roomId: privateGame.roomId,
				playerNumber: privateGame.usersOn,
				letter: privateGame.letters[privateGame.usersOn - 1],
				turn: privateGame.turn[privateGame.usersOn - 1],
				roomType: "private",
				gameValues: privateGame,
			};
			sock.write(
				JSON.stringify({ type: "playersJoined", data: joinInfo })
			);

			gameRooms[privateGame.roomId] = [joinInfo];
		} else if (data.toString().match("gameCode")) {
			const arrInfo = data.toString().split("-");
			var gameRoomId = Number(arrInfo[1]);

			if (gameRooms[gameRoomId] == undefined) {
				sock.write(
					JSON.stringify({ type: "gameNotExist", data: gameRoomId })
				);
			} else {
				var gameValues = gameRooms[gameRoomId][0].gameValues;

				gameValues.usersOn++;

				var joinInfo = {
					id: sock.id,
					roomId: gameValues.roomId,
					playerNumber: gameValues.usersOn,
					letter: gameValues.letters[gameValues.usersOn - 1],
					turn: gameValues.turn[gameValues.usersOn - 1],
					roomType: "private",
				};

				gameRooms[gameRoomId].push(joinInfo);

				sock.write(
					JSON.stringify({ type: "playersJoined", data: joinInfo })
				);

				gameStartWithGameRoom(wss.clients, gameRooms, gameRoomId);
				gameStartWithGameRoom(sockets, gameRooms, gameRoomId);
			}
		}

		if (isJsonString(data)) {
			message = JSON.parse(data);

			if (message.type === "winner") {
				const player = message.data;
				var otherPlayer = getOtherPlayer(player);

				sendWinnerMessageToParticipants(player, otherPlayer, sockets);
				//send to WEB client with websockets
				sendWinnerMessageToParticipants(
					player,
					otherPlayer,
					wss.clients
				);
			}

			if (message.type === "tie") {
				const roomId = message.data;
				sendTieMessageToParticipants(roomId, wss.clients);
				sendTieMessageToParticipants(roomId, sockets);
			}

			if (message.type === "playedMove") {
				
				const movePlayed = message.data;
				var otherPlayer = getOtherPlayer(movePlayed.player);

				var playerRoom = movePlayed.player.roomId;

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
				sendPlayedMoveToParticipants(
					movePlayed,
					otherPlayer,
					sockets,
					info
				);
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
	});

	// Add a 'close' event handler to this instance of socket
	sock.on("end", function () {
		// Code to handle the disconnect event
		removePlayerFromRoom(sock.id);

		//This means the player is alone as he does not have a room
		if (!findPlayerRoom(sock.id)) {
			randomGame = initStartValues();
		} else if (!(gameRooms[findPlayerRoom(sock.id)] == undefined)) {
			if (!(gameRooms[findPlayerRoom(sock.id)].length == 1)) {
				var otherPlayerInfo = findOtherPlayer(sock.id);

				if (otherPlayerInfo != null) {
					var otherPlayer = getOtherPlayer(otherPlayerInfo);
					if (otherPlayer) {
						sendDisconnectMessage(wss.clients, otherPlayer);
						sendDisconnectMessage(sockets, otherPlayer);
					}
				}
			}
		}

		let index = sockets.findIndex(function (o) {
			return (
				o.remoteAddress === sock.remoteAddress &&
				o.remotePort === sock.remotePort
			);
		});
		if (index !== -1) sockets.splice(index, 1);
		console.log("CLOSED: " + sock.remoteAddress + " " + sock.remotePort);
	});
});

function isJsonString(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}
