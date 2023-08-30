const net = require("net");
const client = new net.Socket();
const port = 7070;
const host = "127.0.0.1";

readline = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout,
});

//Initializes variables

playerData = null;
yourTurn = null;
canPlay = false;
box = Array(10).fill("");
gameEnd = false;

function gameStart() {
	canPlay = true;
	yourTurn = playerData.turn;
	checkTurn();
}

//This function returns text based on if it is your turn
function checkTurn() {
	var turnText;
	if (yourTurn) {
		turnText = "Your Turn";
		console.log(turnText);
	} else {
		turnText = " Oponnent's Turn ";
		console.log(turnText);
	}
}

//This compares any amount of arguments you inputs
function areEqual() {
	var len = arguments.length;
	for (var i = 1; i < len; i++) {
		if (
			arguments[i] == null ||
			arguments[i] == "" ||
			arguments[i] != arguments[i - 1]
		) {
			return false;
		}
	}
	return true;
}

function checkTie() {
	isTie = true;
	for (var i = 1; i < 10; i++) {
		var mbox = box[i];
		if (mbox == "" || mbox == null) {
			isTie = false;
		}
	}
	return isTie;
}

function showGameState() {
	console.log(`.${box[1]}.${box[2]}.${box[3]}.`);
	console.log(`.${box[4]}.${box[5]}.${box[6]}.`);
	console.log(`.${box[7]}.${box[8]}.${box[9]}.`);
}

function checkWinner() {
	box1 = box[1];
	box2 = box[2];
	box3 = box[3];

	box4 = box[4];
	box5 = box[5];
	box6 = box[6];

	box7 = box[7];
	box8 = box[8];
	box9 = box[9];

	isWinner = false;

	//Checks top 3 boxes
	if (areEqual(box1, box2, box3)) {
		isWinner = true;

		//Checks middle 3 boxes
	} else if (areEqual(box4, box5, box6)) {
		isWinner = true;
	}

	//Checks bottom 3 boxes
	else if (areEqual(box7, box8, box9)) {
		isWinner = true;
	}

	//Checks left vertical 3 boxes
	else if (areEqual(box1, box4, box7)) {
		isWinner = true;
	}

	//Checks middle vertical 3 boxes
	else if (areEqual(box2, box5, box8)) {
		isWinner = true;
	}

	//Checks right vertical 3 boxes
	else if (areEqual(box3, box6, box9)) {
		isWinner = true;
	}

	//Checks downward slope diagnol 3 boxes
	else if (areEqual(box1, box5, box9)) {
		isWinner = true;
	}

	//Checks downward slope diagnol 3 boxes
	else if (areEqual(box3, box5, box7)) {
		isWinner = true;
	}

	return isWinner;
}

//Initializes things when the game ends
function endGameInit() {
	box = Array(10).fill("");
	canPlay = false;
	readline.question('Do you want to restart "yes" or "no" ? ', (word) => {
		if (word === "yes") {
			restartGame();
			console.log("restart");
			gameEnd = false;
		} else {
			client.end();
			console.log("Game closed");
		}
	});
}

function restartGame() {
	var roomId = playerData.roomId;
	client.write(JSON.stringify({ type: "restartGame", data: roomId }));
}

function playerDisconnected(text) {
	console.log(text);

	if (playerData.roomType == "random") {
		//createFindGameButton()
	}
	canPlay = false;
}

///////////////////

client.connect(port, host, function () {
	console.log("Connected");

	readline.question(
		`To start with a random oponent write "random", 
		to create private room write "createPrivate", 
		to join a private room write "gameCode-number" `,
		(word) => {
			client.write(word);
		}
	);
});

client.on("data", async function (data) {
	const message = JSON.parse(data);
	if (message.type === "playersJoined") {
		joinInfo = message.data;
		playerData = joinInfo;
		if (playerData.roomType == "private") {
			console.log("Room Code: " + joinInfo.roomId);
		}
		console.log("Your Letter: " + joinInfo.letter);
	}

	if (message.type === "gameStart") {
		gameEnd = false;
		gameStart();
		if (yourTurn) {
			showGameState();
			readline.question("which box ? ", (boxNumber) => {
				const playedMove = {
					player: playerData,
					box: boxNumber,
				};
				box[boxNumber] = playerData.letter;
				client.write(
					JSON.stringify({ type: "playedMove", data: playedMove })
				);
			});
		}
	}

	if (message.type === "winnerDetermined") {
		const winner = message.data;
		if (winner.youWon) {
			console.log("you Won!");
		} else {
			console.log("you Lost ...!");
		}
		gameEnd = true;

		console.log("The winner has letter: ", winner.winningLetter);
		endGameInit();
	}

	if (message.type === "tie") {
		console.log("you tied !");
		endGameInit();
	}

	if (message.type === "otherTurn") {
		if (checkWinner()) {
			console.log("found winnner!");
			client.write(JSON.stringify({ type: "winner", data: playerData }));
		} else {
			if (checkTie()) {
				client.write(
					JSON.stringify({ type: "tie", data: playerData.roomId })
				);
			} else {
				yourTurn = false;
				showGameState();
				checkTurn();
			}
		}
	}

	if (message.type === "yourTurn") {
		const info = message.data;
		box[info.boxPlayed] = info.letter;
		yourTurn = true;

		if (checkWinner() || checkTie()) {
			gameEnd = true;
			showGameState();
		}

		if (yourTurn && !gameEnd) {
			showGameState();
			readline.question("which box ?- ", (boxNumber) => {
				const playedMove = {
					player: playerData,
					box: boxNumber,
				};
				box[boxNumber] = playerData.letter;
				client.write(
					JSON.stringify({ type: "playedMove", data: playedMove })
				);
			});
		}
	}

	if (message.type === "gameRestarted") {
		playerData = message.data;
		box = Array(10).fill("");
		gameEnd = false;
		canPlay = true;
		gameStart();
		if (yourTurn) {
			showGameState();
			readline.question("which box ? ", (boxNumber) => {
				const playedMove = {
					player: playerData,
					box: boxNumber,
				};
				box[boxNumber] = playerData.letter;
				client.write(
					JSON.stringify({ type: "playedMove", data: playedMove })
				);
			});
		}
	}

	if (message.type === "playerDisconnect") {
		playerDisconnected("Opponent Disconnected");
		gameEnd = true;
		box = Array(10).fill("");
		readline.close();

		readline = require("readline").createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		readline.question(
			`To start with a random oponent write "random", 
			to create private room write "createPrivate", 
			to join a private room write "gameCode-number" `,
			(word) => {
				client.write(word);
			}
		);
	}

	if (message.type === "gameNotExist") {
		const roomId = message.data;
		console.log("Room " + roomId + " does not exist.");
	}
});

client.on("close", function () {
	console.log("Connection closed");
});
