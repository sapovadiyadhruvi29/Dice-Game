const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

let currentPlayer = 1;

let p1Fixed1, p1Fixed2;
let p2Fixed1, p2Fixed2;

let player1Name = "";
let player2Name = "";

let p1Turns = 0;
let p2Turns = 0;

let p1Step = 0;
let p2Step = 0;

const MAX_TURNS = 5;
const ROLL_TIMEOUT = 20000;

let rollTimer = null;

/* ================= START GAME ================= */

function startGame() {
    playGame();
}

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

/* ================= INIT GAME ================= */

function initGame() {

    player1Name = localStorage.getItem("player1Name");
    player2Name = localStorage.getItem("player2Name");

    if (!player1Name || !player2Name) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("p1Card").querySelector("h3").innerText = player1Name;
    document.getElementById("p2Card").querySelector("h3").innerText = player2Name;

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

    // 🔥 Immediately show current player's fixed dice
    showCurrentPlayerFixedDice();

    currentPlayer = 1;
    p1Turns = 0;
    p2Turns = 0;
    p1Step = 0;
    p2Step = 0;

    updateHighlight();
    showCurrentPlayerFixedDice();
    startRollTimer();
}

/* ================= ROLL ================= */

function rollDice() {

    clearTimeout(rollTimer);

    let roll = random();
    let diceElement = document.getElementById("rollingDice");

    diceElement.classList.add("roll-spin");

    setTimeout(() => {
        diceElement.classList.remove("roll-spin");
        diceElement.innerText = diceFaces[roll];
        handleRoll(roll);
    }, 300);
}

/* ================= HANDLE ROLL ================= */

function handleRoll(roll) {

    if (document.getElementById("winnerOverlay")) return;

    let isP1 = currentPlayer === 1;

    let fixedA = isP1 ? p1Fixed1 : p2Fixed1;
    let fixedB = isP1 ? p1Fixed2 : p2Fixed2;

    let step = isP1 ? p1Step : p2Step;
    let bonusTurn = false;

    // If both finished normal turns → draw
    if (p1Turns >= MAX_TURNS && p2Turns >= MAX_TURNS) {
        finishDraw();
        return;
    }

    // Skip if player already used 5 normal turns
    if (isP1 && p1Turns >= MAX_TURNS) {
        currentPlayer = 2;
        updateHighlight();
        showCurrentPlayerFixedDice();
        startRollTimer();
        return;
    }

    if (!isP1 && p2Turns >= MAX_TURNS) {
        currentPlayer = 1;
        updateHighlight();
        showCurrentPlayerFixedDice();
        startRollTimer();
        return;
    }

    // Sequential matching
    if (step === 0 && roll === fixedA) {
        step = 1;
        bonusTurn = true;
        showBonus(isP1 ? player1Name : player2Name);
    }
    else if (step === 1 && roll === fixedB) {
        finishGame(isP1 ? player1Name : player2Name);
        return;
    }
    else {
        step = 0;
    }

    if (isP1) {
        if (!bonusTurn) p1Turns++;
        p1Step = step;
    } else {
        if (!bonusTurn) p2Turns++;
        p2Step = step;
    }

    addResultRow(
        isP1 ? "p1Table" : "p2Table",
        diceFaces[roll] + (bonusTurn ? " 🔥" : "")
    );

    if (!bonusTurn) {
        currentPlayer = isP1 ? 2 : 1;
    }

    updateHighlight();
    showCurrentPlayerFixedDice();
    startRollTimer();
}

/* ================= TABLE ================= */

function addResultRow(tableId, result) {
    let table = document.getElementById(tableId);
    let row = table.insertRow();
    row.insertCell(0).innerText = table.rows.length - 1;
    row.insertCell(1).innerText = result;
}

/* ================= SHOW FIXED DICE ================= */

function showCurrentPlayerFixedDice() {

    if (currentPlayer === 1) {
        document.getElementById("dice1").innerText = diceFaces[p1Fixed1];
        document.getElementById("dice2").innerText = diceFaces[p1Fixed2];
    } else {
        document.getElementById("dice1").innerText = diceFaces[p2Fixed1];
        document.getElementById("dice2").innerText = diceFaces[p2Fixed2];
    }
}

/* ================= BONUS ================= */

function showBonus(name) {
    let box = document.getElementById("bonusMsg");
    box.innerText = "🔥 BONUS TURN : " + name;
    box.style.display = "block";
    setTimeout(() => box.style.display = "none", 1500);
}

/* ================= FINISH ================= */

function finishGame(winner) {

    clearTimeout(rollTimer);
    saveMatchResult(winner);
    showWinnerScreen("🏆 " + winner + " Wins!");
}

function finishDraw() {

    clearTimeout(rollTimer);
    saveMatchResult("Draw");
    showWinnerScreen("Game Draw!");
}

/* ================= SAVE MATCH ================= */

function saveMatchResult(result) {

    let history = JSON.parse(localStorage.getItem("gameHistory") || "[]");

    history.push({
        p1: player1Name,
        p2: player2Name,
        result: result
    });

    localStorage.setItem("gameHistory", JSON.stringify(history));
}

/* ================= LEADERBOARD ================= */

function loadLeaderboard() {

    let tbody = document.getElementById("leaderboardBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    let history = JSON.parse(localStorage.getItem("gameHistory") || "[]");

    if (history.length === 0) {
        let row = tbody.insertRow();
        let cell = row.insertCell(0);
        cell.colSpan = 3;
        cell.innerText = "No games played yet";
        return;
    }

    history.forEach(game => {
        let row = tbody.insertRow();
        row.insertCell(0).innerText = game.p1;
        row.insertCell(1).innerText = game.p2;
        row.insertCell(2).innerText = game.result;
    });
}

/* ================= WINNER SCREEN ================= */

function showWinnerScreen(text) {

    if (document.getElementById("winnerOverlay")) return;

    let screen = document.createElement("div");
    screen.id = "winnerOverlay";
    screen.className = "winner-screen";

    screen.innerHTML = `
        <div class="winner-box">
            <h1>${text}</h1>
            <button onclick="goHome()">🏠 Home</button>
        </div>
    `;

    document.body.appendChild(screen);
}

function goHome() {
    window.location.href = "index.html";
}

/* ================= TIMER ================= */

function startRollTimer() {

    clearTimeout(rollTimer);

    rollTimer = setTimeout(() => {

        if (!document.getElementById("winnerOverlay")) {
            rollDice();
        }

    }, ROLL_TIMEOUT);
}

/* ================= RANDOM ================= */

function random() {
    return Math.floor(Math.random() * 6);
}