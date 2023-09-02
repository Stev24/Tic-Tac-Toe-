const { getRandomInt, initStartValues, getGameType } = require("./server/game");

const {
	chooseGameType,
	gameHandler,
	disconnectionHandler,
} = require("./server/functions");

const { isJsonString, getContentType } = require("./server/helpers");

const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const server = http.createServer();
const publicPath = path.join(__dirname, "public");

var gameType;
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
		gameType = getGameType(gameQuery);
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

var randomGame = initStartValues();
var gameRooms = {};

//**** Websockets connection */

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

//**** TCP Connection */

const net = require("net");
const serverTCP = net.createServer();

let sockets = [];

serverTCP.on("connection", function (sock) {
	sock.id = getRandomInt(1, 1000);
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

const port = 7070;
const host = "127.0.0.1";

serverTCP.listen(port, host, () => {
	console.log("TCP Server is running on port " + port + ".");
});
