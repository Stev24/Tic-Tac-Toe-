const { getRandomInt, initStartValues } = require("./server/game");

const {
	chooseGameType,
	gameHandler,
	disconnectionHandler,
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

	chooseGameType(
		gameType,
		randomGame,
		gameRooms,
		socket,
		sockets,
		wss,
		gameQuery
	);

	playersRematch = 0;

	socket.addEventListener("message", (event) => {
		const message = JSON.parse(event.data);
		gameHandler(message, wss, sockets, gameRooms);
	});

	socket.addEventListener("close", function () {
		disconnectionHandler(socket, gameRooms, wss, sockets);
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
			gameHandler(message, wss, sockets, gameRooms);
		}
	});

	sock.on("end", function () {
		disconnectionHandler(sock, gameRooms, wss, sockets);
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
