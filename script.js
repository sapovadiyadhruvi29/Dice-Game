const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

let currentPlayer = 1;

let p1Fixed;
let p2Fixed;

let bonusMode = false;

let player1Name = "";
let player2Name = "";

let p1Turns = 0;
let p2Turns = 0;

const MAX_TURNS = 5;

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
    if (!regex.test(p1)) { error.innerText = "Only alphabets allowed"; return; }
    if (!regex.test(p2)) { error.innerText = "Only alphabets allowed"; return; }
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

    p1Fixed = random();

    do {
        p2Fixed = random();
    } while (p2Fixed === p1Fixed);

    document.getElementById("dice1").innerText = diceFaces[p1Fixed];
    document.getElementById("dice2").innerText = diceFaces[p2Fixed];

    updateHighlight();
    startRollTimer();
}

// ================= ROLL DICE =================
function rollDice() {

    clearInterval(countdownInterval);

    const diceEl = document.getElementById("rollingDice");

    let finalRoll = random();
    let elapsed = 0;

    const anim = setInterval(() => {
        diceEl.innerText = diceFaces[random()];
        elapsed += 100;

        if (elapsed >= 1000) {
            clearInterval(anim);
            diceEl.innerText = diceFaces[finalRoll];

            if (currentPlayer === 1 && p1Turns < MAX_TURNS)
                handleRoll(finalRoll, "p1");
            else if (currentPlayer === 2 && p2Turns < MAX_TURNS)
                handleRoll(finalRoll, "p2");
        }

    }, 100);
}

// ================= HANDLE ROLL =================
function handleRoll(roll, player) {

    const isP1 = player === "p1";
    const ownFixed = isP1 ? p1Fixed : p2Fixed;
    const opponentFixed = isP1 ? p2Fixed : p1Fixed;
    const playerName = isP1 ? player1Name : player2Name;
    const tableId = isP1 ? "p1Table" : "p2Table";

    let turnNumber = isP1 ? p1Turns + 1 : p2Turns + 1;

    // ===== BONUS MODE =====
    if (bonusMode) {

        if (roll === opponentFixed) {
            addToTable(tableId, "Bonus", diceFaces[roll], "🏆 WIN");
            finishGame(playerName);
            return;
        }

        if (roll === ownFixed) {
            addToTable(tableId, "Bonus", diceFaces[roll], "🔥 Bonus Again");
            startRollTimer();
            return;
        }

        addToTable(tableId, "Bonus", diceFaces[roll], "❌ Bonus Failed");
        bonusMode = false;
        currentPlayer = isP1 ? 2 : 1;
        updateHighlight();
        startRollTimer();
        return;
    }

    // ===== NORMAL MODE =====

    if (roll === ownFixed) {
        addToTable(tableId, turnNumber, diceFaces[roll], "🔥 Bonus");
        bonusMode = true;
        startRollTimer();
        return;
    }

    // Wrong roll
    addToTable(tableId, turnNumber, diceFaces[roll], "❌");

    if (isP1) {
        p1Turns++;
        currentPlayer = 2;
    } else {
        p2Turns++;
        currentPlayer = 1;
    }

    updateHighlight();

    // DRAW
    if (p1Turns >= MAX_TURNS && p2Turns >= MAX_TURNS) {
        finishDraw();
        return;
    }

    startRollTimer();
}

// ================= TABLE =================
function addToTable(tableId, turn, roll, status) {
    const table = document.getElementById(tableId);
    const row = document.createElement("tr");
    row.innerHTML = `<td>${turn}</td><td>${roll}</td><td>${status}</td>`;
    table.appendChild(row);
}

// ================= TIMER =================
function startRollTimer() {

    clearInterval(countdownInterval);
    timeLeft = 20;

    const timerEl = document.getElementById("timer");
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

// ================= FINISH =================
function finishGame(winner) {
    saveLeaderboard(winner);
    document.getElementById("winnerText").innerText = `🏆 ${winner} Wins!`;
    document.getElementById("winnerScreen").style.display = "flex";
    clearInterval(countdownInterval);
}

function finishDraw() {
    saveLeaderboard("Draw");
    document.getElementById("drawScreen").style.display = "flex";
    clearInterval(countdownInterval);
}

// ================= LEADERBOARD =================
function saveLeaderboard(result) {
    let history = JSON.parse(localStorage.getItem("leaderboard")) || [];
    history.push({ player1: player1Name, player2: player2Name, result });
    localStorage.setItem("leaderboard", JSON.stringify(history));
}

function loadLeaderboard() {
    const tbody = document.getElementById("leaderboardBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    let history = JSON.parse(localStorage.getItem("leaderboard")) || [];

    history.forEach(game => {
        const row = document.createElement("tr");
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

// ================= TURN HIGHLIGHT =================
function updateHighlight() {

    const p1Box = document.getElementById("p1Card");
    const p2Box = document.getElementById("p2Card");
    const turn1 = document.getElementById("turn1");
    const turn2 = document.getElementById("turn2");

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