function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

//This sets the combination of what letter each player will get
function assignLetter() {
	const number = getRandomInt(0, 1);
	let players = [];
	if (number == 0) {
		players = ["X", "O"];
	} else if (number == 1) {
		players = ["O", "X"];
	}
	return players;
}

//This sets the combination of who will start the game
function assignTurn() {
	const number = getRandomInt(0, 1);
	let turn = [];
	if (number == 0) {
		turn = [true, false];
	} else if (number == 1) {
		turn = [false, true];
	}
	return turn;
}

//This is when you don't have the playerData and you only have the player Id.
//This returns the whole player data when only the playerId is available
function findOtherPlayer(playerId, gameRooms) {
	for (const room in gameRooms) {
		for (let i = 0; i < gameRooms[room].length; i++) {
			gameRooms[room][i].id;
			if (playerId == gameRooms[room][i].id) {
				return gameRooms[room][i];
			}
		}
	}
}

//This is when you have the playerData
function getOtherPlayer(player, gameRooms) {
	const playerData = gameRooms[player.roomId];

	let otherPlayer;

	if (playerData[0].playerNumber == player.playerNumber) {
		otherPlayer = playerData[1];
	} else if (playerData[1].playerNumber == player.playerNumber) {
		otherPlayer = playerData[0];
	}

	return otherPlayer;
}

// find player's room
function findPlayerRoom(playerId, gameRooms){
	for (const room in gameRooms){
		for (let i = 0; i < gameRooms[room].length; i++){
			if (playerId == gameRooms[room][i].id){
				return room
			}
		}
	}
	//This means the player does not have a room
	return false
}

//This is used to switch who starts the game at every new game
function randomizePlayerTurn(playerData) {
	const turn = assignTurn();

	playerData[0].turn = turn[0];
	playerData[1].turn = turn[1];

	return playerData;
}

function getRoomId() {
	return getRandomInt(1, 10000);
}

function initStartValues() {
	const letters = assignLetter();
	const turn = assignTurn();
	const playerData = [];
	const usersOn = 1;
	const roomId = getRoomId();

	const valueList = {
		letters: letters,
		turn: turn,
		playerData: playerData,
		usersOn: usersOn,
		roomId: roomId,
	};

	return valueList;
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
};
