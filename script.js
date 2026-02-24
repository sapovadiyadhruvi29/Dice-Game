const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

let currentPlayer = 1;

// Player 1 fixed dice
let p1Fixed1, p1Fixed2;
let p1FirstMatch = false;
let p1SecondMatch = false;

// Player 2 fixed dice
let p2Fixed1, p2Fixed2;
let p2FirstMatch = false;
let p2SecondMatch = false;

let player1Name = "";
let player2Name = "";

let p1Turns = 0;
let p2Turns = 0;

const MAX_TURNS = 5;
const MAX_ENERGY = 100;

let p1Energy = MAX_ENERGY;
let p2Energy = MAX_ENERGY;

let countdownInterval = null;
let timeLeft = 20;

// ================= START GAME =================
function startGame() {
    playGame();
}

// ================= NAME VALIDATION =================
function playGame() {
    let p1 = document.getElementById("p1").value.trim();
    let p2 = document.getElementById("p2").value.trim();
    let error = document.getElementById("error");

    let regex = /^[A-Za-z]+$/;
    error.innerText = "";

    if (!p1) { error.innerText = "Player1 Name cannot be empty"; return; }
    if (!p2) { error.innerText = "Player2 Name cannot be empty"; return; }
    if (!regex.test(p1)) { error.innerText = "Player1 Name must contain only alphabets"; return; }
    if (!regex.test(p2)) { error.innerText = "Player2 Name must contain only alphabets"; return; }
    if (p1.toLowerCase() === p2.toLowerCase()) { error.innerText = "Names cannot be same"; return; }

    localStorage.setItem("player1Name", p1);
    localStorage.setItem("player2Name", p2);

    window.location.href = "game.html";
}

// ================= INIT GAME =================
function initGame() {
    player1Name = localStorage.getItem("player1Name");
    player2Name = localStorage.getItem("player2Name");

    if (!player1Name || !player2Name) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("p1Name").innerText = player1Name;
    document.getElementById("p2Name").innerText = player2Name;

    // Player 1 fixed dice
    p1Fixed1 = random();
    p1Fixed2 = random();
    while (p1Fixed2 === p1Fixed1) {
        p1Fixed2 = random();
    }

    // Player 2 fixed dice
    p2Fixed1 = random();
    p2Fixed2 = random();
    while (p2Fixed2 === p2Fixed1) {
        p2Fixed2 = random();
    }

    document.getElementById("dice1").innerText = diceFaces[p1Fixed1];
    document.getElementById("dice2").innerText = diceFaces[p1Fixed2];

    updateProgressBars();
    updateHighlight();
    startRollTimer();
}

// ================= ROLL DICE =================
function rollDice() {
    clearInterval(countdownInterval);

    // If both players finished 5 turns, finish game as draw
    if (p1Turns >= MAX_TURNS && p2Turns >= MAX_TURNS) {
        finishDraw();
        return;
    }

    let roll = random();
    document.getElementById("rollingDice").innerText = diceFaces[roll];

    if (currentPlayer === 1) {
        if (p1Turns < MAX_TURNS) {
            p1Turns++;
            addToTable("p1Table", p1Turns, diceFaces[roll]);
            handleRoll(roll);
        } else {
            // Skip to Player 2 if Player 1 already finished 5 turns
            currentPlayer = 2;
            updateHighlight();
            startRollTimer();
        }
    } else {
        if (p2Turns < MAX_TURNS) {
            p2Turns++;
            addToTable("p2Table", p2Turns, diceFaces[roll]);
            handleRoll(roll);
        } else {
            // Skip to Player 1 if Player 2 already finished 5 turns
            currentPlayer = 1;
            updateHighlight();
            startRollTimer();
        }
    }
}

// ================= HANDLE ROLL =================
function handleRoll(roll) {
    let matched = false;

    if (currentPlayer === 1 && p1Turns <= MAX_TURNS) {
        if (!p1FirstMatch && roll === p1Fixed1) {
            p1FirstMatch = true;
            matched = true;
            showBonus(player1Name);
        } else if (p1FirstMatch && !p1SecondMatch && roll === p1Fixed2) {
            p1SecondMatch = true;
            finishGame(player1Name);
            return;
        }

        if (!matched) {
            p1Energy = Math.max(0, p1Energy - 20);
        }

        currentPlayer = 2; // Switch turn only if not matched sequence

    } else if (currentPlayer === 2 && p2Turns <= MAX_TURNS) {
        if (!p2FirstMatch && roll === p2Fixed1) {
            p2FirstMatch = true;
            matched = true;
            showBonus(player2Name);
        } else if (p2FirstMatch && !p2SecondMatch && roll === p2Fixed2) {
            p2SecondMatch = true;
            finishGame(player2Name);
            return;
        }

        if (!matched) {
            p2Energy = Math.max(0, p2Energy - 20);
        }

        currentPlayer = 1; // Switch turn only if not matched sequence
    }

    updateProgressBars();
    updateHighlight();
    startRollTimer();

    // ✅ Finish draw only if BOTH players have reached 5 turns and NO one matched both dice
    if (p1Turns >= MAX_TURNS && p2Turns >= MAX_TURNS) {
        if (!p1SecondMatch && !p2SecondMatch) {
            finishDraw();
        }
    }
}

// ================= TABLE FUNCTION =================
function addToTable(tableId, turn, roll) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const row = document.createElement("tr");
    const cell1 = document.createElement("td");
    const cell2 = document.createElement("td");

    cell1.textContent = turn;
    cell2.textContent = roll;

    row.appendChild(cell1);
    row.appendChild(cell2);

    table.appendChild(row);
}

// ================= TIMER =================
function startRollTimer() {
    clearInterval(countdownInterval);

    timeLeft = 20;
    const timerEl = document.getElementById("timer");

    if (!timerEl) return;

    timerEl.innerText = timeLeft;

    countdownInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            rollDice();
        }
    }, 1000);
}
// ================= PROGRESS =================
function updateProgressBars() {
    document.getElementById("p1Progress").style.width = p1Energy + "%";
    document.getElementById("p2Progress").style.width = p2Energy + "%";

    // Only declare winner if a player matched both fixed dice sequence
    if (p1Energy <= 0 && p1SecondMatch) finishGame(player2Name);
    if (p2Energy <= 0 && p2SecondMatch) finishGame(player1Name);
}


// ================= BONUS =================
function showBonus(name) {
    let box = document.getElementById("bonusMsg");
    box.innerText = "🔥 BONUS TURN : " + name;
    box.style.display = "block";

    setTimeout(() => {
        box.style.display = "none";
    }, 1500);
}

// ================= FINISH =================
function finishGame(winner) {
    saveLeaderboard(winner);

    const winnerScreen = document.getElementById("winnerScreen");
    const winnerText = document.getElementById("winnerText");

    winnerText.innerText = `🏆 ${winner} Wins!`;
    winnerScreen.style.display = "flex";

    clearInterval(countdownInterval);
}

// ================= DRAW =================
function finishDraw() {
    saveLeaderboard("Draw");

    const drawScreen = document.getElementById("drawScreen");
    drawScreen.style.display = "flex";

    clearInterval(countdownInterval); // Stop timer
}

// ================= LEADERBOARD =================
function saveLeaderboard(result) {
    let history = JSON.parse(localStorage.getItem("leaderboard")) || [];

    history.push({
        player1: player1Name,
        player2: player2Name,
        result: result
    });

    localStorage.setItem("leaderboard", JSON.stringify(history));
}

function loadLeaderboard() {
    let tbody = document.getElementById("leaderboardBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    let history = JSON.parse(localStorage.getItem("leaderboard")) || [];

    history.forEach((game) => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${game.player1}</td>
            <td>${game.player2}</td>
            <td>${game.result}</td>
        `;
        tbody.appendChild(row);
    });
}

// ================= UTIL =================
function random() {
    return Math.floor(Math.random() * 6);
}

function goHome() {
    window.location.href = "index.html";
}

// ================= HIGHLIGHT =================
function updateHighlight() {
    const p1Box = document.getElementById("p1Card");
    const p2Box = document.getElementById("p2Card");
    const turn1 = document.getElementById("turn1");
    const turn2 = document.getElementById("turn2");

    if (!p1Box || !p2Box) return;

    if (currentPlayer === 1) {
        p1Box.classList.add("player-active");
        p2Box.classList.remove("player-active");
        turn1.style.display = "inline";
        turn2.style.display = "none";
    } else {
        p2Box.classList.add("player-active");
        p1Box.classList.remove("player-active");
        turn2.style.display = "inline";
        turn1.style.display = "none";
    }
}