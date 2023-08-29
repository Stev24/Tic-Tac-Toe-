const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const server = http.createServer();

const publicPath = path.join(__dirname, 'public');

var gameType;
function getGameType(gameQuery){
	for (key in gameQuery){
		gameType = key.toString()
	}
}

var gameQuery;

server.on('request', (req, res) => {
    const url = req.url;
    if (url.startsWith('/join')) {
        const joinPath = path.join(__dirname, 'views', 'join.html');
        fs.readFile(joinPath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (url.startsWith('/game')) {
        gameQuery = require('url').parse(url, true).query;
        getGameType(gameQuery);
        const gamePath = path.join(__dirname, 'views', 'game.html');
        fs.readFile(gamePath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (url === '/') {
        const indexPath = path.join(__dirname, 'views', 'index.html');
        fs.readFile(indexPath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else {
        const filePath = path.join(publicPath, url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                const contentType = getContentType(filePath);
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            }
        });
    }
});

function getContentType(filePath) {
    const extname = path.extname(filePath);
    switch (extname) {
        case '.js':
            return 'text/javascript';
        case '.css':
            return 'text/css';
        case '.html':
            return 'text/html';
        default:
            return 'application/octet-stream';
    }
}

function getRandomInt(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

//This sets the combination of what letter each player will get
function assignLetter(){
	number = getRandomInt(0, 1)
	if (number == 0){
		players = ["X", "O"]
	}else if (number == 1){
		players = ["O", "X"]
	}
	return players
}

//This sets the combination of who will start the game
function assignTurn(){
	number = getRandomInt(0, 1)
	if (number == 0){
		turn = [true, false]
	}else if (number == 1){
		turn = [false, true]
	}
	return turn
}

//This is when you don't have the playerData and you only have the player Id.
//This returns the whole player data when only the playerId is available
function findOtherPlayer(playerId){
	for (var room in gameRooms){
		for (var i = 0; i < gameRooms[room].length; i++){
			gameRooms[room][i].id
			if (playerId == gameRooms[room][i].id){
				return gameRooms[room][i]
			}
		}
	}
}

//This is when you have the playerData
function getOtherPlayer(player){
	var playerData = gameRooms[player.roomId]
	
	var otherPlayer;
	
	if (playerData[0].playerNumber == player.playerNumber){
		otherPlayer = playerData[1]
	}else if (playerData[1].playerNumber == player.playerNumber){
		otherPlayer = playerData[0]
	}
	
	return otherPlayer
}

function findPlayerRoom(playerId){
	for (var room in gameRooms){
		for (var i = 0; i < gameRooms[room].length; i++){
			gameRooms[room][i].id
			if (playerId == gameRooms[room][i].id){
				return room
			}
		}
	}
	
	//This means the player does not have a room
	return false
}

//This is used to switch who starts the game at every new game
function randomizePlayerTurn(playerData){
	turn = assignTurn()
	
	playerData[0].turn = turn[0]
	playerData[1].turn = turn[1]
	
	return playerData
}

function getRoomId(){
	return getRandomInt(1, 10000)
}

function initStartValues(){
	letters = assignLetter()
	turn = assignTurn()
	playerData = []
	usersOn = 1
	roomId = getRoomId()
	
	valueList = {
		letters: letters,
		turn: turn,
		playerData: playerData,
		usersOn: usersOn,
		roomId: roomId,
	}
	
	return valueList
	
}

function removePlayerFromRoom(playerId){
	for (var i = 0; i < playerData.length; i++){
		if (playerId == playerData[i].id){
			playerData.splice(i, 1)
			return
		}
	}
}

randomGame = initStartValues()

gameRooms = {}



const wss = new WebSocket.Server({ server });

wss.on('connection', function(socket) { 

	socket.id = getRandomInt(1, 1000);
	if (gameType == "random"){
		
		var joinInfo = {
			id: socket.id,
			roomId: randomGame.roomId,
			playerNumber: randomGame.usersOn,
			letter: randomGame.letters[(randomGame.usersOn - 1)],
			turn: randomGame.turn[randomGame.usersOn - 1],
			roomType: "random",
		}
				
		randomGame.playerData.push(joinInfo)
		
		randomGame.usersOn++
		
		socket.send(JSON.stringify({type: "playersJoined", data: joinInfo}));

		
		if (randomGame.usersOn > 2){
			gameRooms[randomGame.roomId] = randomGame.playerData;
			wss.clients.forEach(function (client) {
				client.send(JSON.stringify({type: "gameStart"}));
			});
			randomGame = initStartValues()
		}
	}else if (gameType == "createPrivate"){

		//socket.id = getRandomInt(1, 1000);

		var privateGame = initStartValues()
		var joinInfo = {
			id: socket.id,
			roomId: privateGame.roomId,
			playerNumber: privateGame.usersOn,
			letter: privateGame.letters[(privateGame.usersOn - 1)],
			turn: privateGame.turn[privateGame.usersOn - 1],
			roomType: "private",
			gameValues: privateGame,
		}
		socket.send(JSON.stringify({type: "playersJoined", data: joinInfo}));
		
		gameRooms[privateGame.roomId] = [joinInfo]
		
	} else if (gameType == "gameCode"){

		var gameRoomId = Number(gameQuery.gameCode)
		if (gameRooms[gameRoomId] == undefined){
			socket.send(JSON.stringify({type: "gameNotExist", data: gameRoomId}));
		}else{
			var gameValues = gameRooms[gameRoomId][0].gameValues
			
			gameValues.usersOn ++
			
			var joinInfo = {
				id: socket.id,
				roomId: gameValues.roomId,
				playerNumber: gameValues.usersOn,
				letter: gameValues.letters[gameValues.usersOn - 1],
				turn: gameValues.turn[gameValues.usersOn - 1],
				roomType: "private",
			}
						
			gameRooms[gameRoomId].push(joinInfo)
			
			socket.send(JSON.stringify({type: "playersJoined", data: joinInfo}));

			wss.clients.forEach(client => {
				if(client.id === gameRooms[gameRoomId][0].id) {
					client.send(JSON.stringify({type: "gameStart"}));
				} 
				if(client.id === gameRooms[gameRoomId][1].id) {
					client.send(JSON.stringify({type: "gameStart"}));
				}
			})
			
		}
	}

	playersRematch = 0

	socket.addEventListener('message', (event) => {
		const message = JSON.parse(event.data);

		if (message.type === 'winner') {
			const player = message.data;
			var otherPlayer = getOtherPlayer(player)

			wss.clients.forEach(client => { 
				if(client.id === player.id) {
					client.send(JSON.stringify({type: "winnerDetermined", data: {youWon: true, winningLetter: player.letter}}));
				} 
				if(client.id === otherPlayer.id) {
					client.send(JSON.stringify({type: "winnerDetermined", data: {youWon: false, winningLetter: player.letter}}));
				}
			})
		}

		if (message.type === 'tie') {
			const roomId = message.data;
			wss.clients.forEach(client => {
				if(client.id === gameRooms[roomId][0].id) {
					client.send(JSON.stringify({type: "tie"}));
				} 
				if(client.id === gameRooms[roomId][1].id) {
					client.send(JSON.stringify({type: "tie"}));
				}
			})
		}
	
		if (message.type === 'playedMove') {
			const movePlayed = message.data;
			var otherPlayer = getOtherPlayer(movePlayed.player)
		
			var playerRoom = movePlayed.player.roomId
				
			info = {
				boxPlayed: movePlayed.box,
				letter: movePlayed.player.letter
			}

			wss.clients.forEach(client => { 
				if(client.id === otherPlayer.id) {
					client.send(JSON.stringify({type: "yourTurn", data: info}));
				} 
				if(client.id === movePlayed.player.id) {
					client.send(JSON.stringify({type: "otherTurn"}));
				}
			})
		}

		if (message.type === 'restartGame') { 
			const roomId = message.data;

			playersRematch ++
			if (playersRematch == 2){
				newPlayerData = randomizePlayerTurn(gameRooms[roomId])

				wss.clients.forEach(client => { 
					if(client.id === gameRooms[roomId][0].id) {
						client.send(JSON.stringify({type: "gameRestarted", data: newPlayerData[0]}));
					} 
					if(client.id === gameRooms[roomId][1].id) {
						client.send(JSON.stringify({type: "gameRestarted", data: newPlayerData[1]}));
					}
				})
				playersRematch = 0
			}
		}
	});

	socket.addEventListener('close', function() {
		// Code to handle the disconnect event
		removePlayerFromRoom(socket.id)
				
		//This means the player is alone as he does not have a room
		if (!findPlayerRoom(socket.id)){
			randomGame = initStartValues()
		}else if (!(gameRooms[findPlayerRoom(socket.id)] == undefined)){ 
			if (!(gameRooms[findPlayerRoom(socket.id)].length == 1)){
				
				var otherPlayerInfo = findOtherPlayer(socket.id)
								
				if (otherPlayerInfo != null){
					var otherPlayer = getOtherPlayer(otherPlayerInfo)
					if(otherPlayer){
						wss.clients.forEach(client => { 
							if(client.id === otherPlayer.id) {
								client.send(JSON.stringify({type: "playerDisconnect"}));
							} 
						})
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
