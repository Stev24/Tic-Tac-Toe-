function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

//This sets the combination of what letter each player will get
function assignLetter() {
	number = getRandomInt(0, 1);
	if (number == 0) {
		players = ["X", "O"];
	} else if (number == 1) {
		players = ["O", "X"];
	}
	return players;
}

//This sets the combination of who will start the game
function assignTurn() {
	number = getRandomInt(0, 1);
	if (number == 0) {
		turn = [true, false];
	} else if (number == 1) {
		turn = [false, true];
	}
	return turn;
}

//This is when you don't have the playerData and you only have the player Id.
//This returns the whole player data when only the playerId is available
function findOtherPlayer(playerId) {
	for (var room in gameRooms) {
		for (var i = 0; i < gameRooms[room].length; i++) {
			gameRooms[room][i].id;
			if (playerId == gameRooms[room][i].id) {
				return gameRooms[room][i];
			}
		}
	}
}

//This is when you have the playerData
function getOtherPlayer(player) {
	var playerData = gameRooms[player.roomId];

	var otherPlayer;

	if (playerData[0].playerNumber == player.playerNumber) {
		otherPlayer = playerData[1];
	} else if (playerData[1].playerNumber == player.playerNumber) {
		otherPlayer = playerData[0];
	}

	return otherPlayer;
}

function findPlayerRoom(playerId) {
	for (var room in gameRooms) {
		for (var i = 0; i < gameRooms[room].length; i++) {
			gameRooms[room][i].id;
			if (playerId == gameRooms[room][i].id) {
				return room;
			}
		}
	}

	//This means the player does not have a room
	return false;
}

//This is used to switch who starts the game at every new game
function randomizePlayerTurn(playerData) {
	turn = assignTurn();

	playerData[0].turn = turn[0];
	playerData[1].turn = turn[1];

	return playerData;
}

function getRoomId() {
	return getRandomInt(1, 10000);
}

function initStartValues() {
	letters = assignLetter();
	turn = assignTurn();
	playerData = [];
	usersOn = 1;
	roomId = getRoomId();

	valueList = {
		letters: letters,
		turn: turn,
		playerData: playerData,
		usersOn: usersOn,
		roomId: roomId,
	};

	return valueList;
}

function removePlayerFromRoom(playerId) {
	for (var i = 0; i < playerData.length; i++) {
		if (playerId == playerData[i].id) {
			playerData.splice(i, 1);
			return;
		}
	}
}

module.exports = {
	getRandomInt,
	assignLetter,
	assignTurn,
	findOtherPlayer,
	getOtherPlayer,
	findPlayerRoom,
	randomizePlayerTurn,
	getRoomId,
	initStartValues,
	removePlayerFromRoom,
};
