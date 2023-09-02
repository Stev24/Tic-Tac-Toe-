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
	gameStartWithGameRoom,
	chooseGameType,
	gameHandler
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

	chooseGameType(gameType, randomGame, gameRooms, socket, sockets, wss, gameQuery);

	playersRematch = 0;

	socket.addEventListener("message", (event) => {
		const message = JSON.parse(event.data);
		gameHandler(message, wss, sockets, gameRooms);
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
		chooseGameType(data, randomGame, gameRooms, sock, sockets, wss, null);

		if (isJsonString(data)) {
			message = JSON.parse(data);
			gameHandler(message, wss, sockets, gameRooms)
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
