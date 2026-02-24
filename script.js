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
function startGame() { playGame(); }

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

    if (!player1Name || !player2Name) { window.location.href = "index.html"; return; }

    document.getElementById("p1Name").innerText = player1Name;
    document.getElementById("p2Name").innerText = player2Name;

    // Player 1 fixed dice
    p1Fixed1 = random();
    p1Fixed2 = random();
    while (p1Fixed2 === p1Fixed1) p1Fixed2 = random();

    // Player 2 fixed dice
    p2Fixed1 = random();
    p2Fixed2 = random();
    while (p2Fixed2 === p2Fixed1) p2Fixed2 = random();

    document.getElementById("dice1").innerText = diceFaces[p1Fixed1];
    document.getElementById("dice2").innerText = diceFaces[p1Fixed2];

    updateProgressBars();
    updateHighlight();
    startRollTimer();
}

// ================= ROLL DICE =================
function rollDice() {
    clearInterval(countdownInterval);

    let roll = random(); // The final dice roll

    const diceEl = document.getElementById("rollingDice");
    if (!diceEl) return;

    let elapsed = 0;
    const duration = 1000; // total animation duration in ms
    const intervalTime = 100; // time between face changes

    // Animate dice rolling
    const animInterval = setInterval(() => {
        diceEl.innerText = diceFaces[random()]; // show random face
        elapsed += intervalTime;

        if (elapsed >= duration) {
            clearInterval(animInterval);
            diceEl.innerText = diceFaces[roll]; // show final roll

            // After animation, handle the roll
            if (currentPlayer === 1 && p1Turns < MAX_TURNS) handleRoll(roll, "p1");
            else if (currentPlayer === 2 && p2Turns < MAX_TURNS) handleRoll(roll, "p2");
        }
    }, intervalTime);
}

// ================= HANDLE ROLL =================
function handleRoll(roll, player) {
    let matched = false;
    let bonusTurn = false;

    if (player === "p1") {
        if (!p1FirstMatch && roll === p1Fixed1) {
            p1FirstMatch = true;
            matched = true;
            bonusTurn = true;
            showBonus(player1Name);
            addToTable("p1Table", "Bonus", diceFaces[roll], "✔"); // bonus turn, not counted
        } else if (p1FirstMatch && !p1SecondMatch && roll === p1Fixed2) {
            p1SecondMatch = true;
            p1Turns++;
            addToTable("p1Table", p1Turns, diceFaces[roll], "✔");
            finishGame(player1Name);
            return;
        } else {
            p1Energy = Math.max(0, p1Energy - 20);
            p1Turns++;
            addToTable("p1Table", p1Turns, diceFaces[roll], "❌");
            currentPlayer = 2;
        }
        if (bonusTurn) currentPlayer = 1; // keep turn
    } else {
        if (!p2FirstMatch && roll === p2Fixed1) {
            p2FirstMatch = true;
            matched = true;
            bonusTurn = true;
            showBonus(player2Name);
            addToTable("p2Table", "Bonus", diceFaces[roll], "✔");
        } else if (p2FirstMatch && !p2SecondMatch && roll === p2Fixed2) {
            p2SecondMatch = true;
            p2Turns++;
            addToTable("p2Table", p2Turns, diceFaces[roll], "✔");
            finishGame(player2Name);
            return;
        } else {
            p2Energy = Math.max(0, p2Energy - 20);
            p2Turns++;
            addToTable("p2Table", p2Turns, diceFaces[roll], "❌");
            currentPlayer = 1;
        }
        if (bonusTurn) currentPlayer = 2;
    }

    updateProgressBars();
    updateHighlight();

    // Check draw
    if (p1Turns >= MAX_TURNS && p2Turns >= MAX_TURNS) {
        if (!p1SecondMatch && !p2SecondMatch) finishDraw();
        return;
    }

    // Start timer again
    if ((currentPlayer === 1 && p1Turns < MAX_TURNS) || (currentPlayer === 2 && p2Turns < MAX_TURNS)) startRollTimer();
}

// ================= TABLE FUNCTION =================
function addToTable(tableId, turn, roll, match) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const row = document.createElement("tr");
    row.innerHTML = `<td>${turn}</td><td>${roll}</td><td>${match}</td>`;
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
}

// ================= BONUS =================
function showBonus(name) {
    const box = document.getElementById("bonusMsg");
    box.innerText = "🔥 BONUS TURN : " + name;
    box.style.display = "block";
    setTimeout(() => box.style.display = "none", 1500);
}

// ================= FINISH =================
function finishGame(winner) {
    saveLeaderboard(winner);
    document.getElementById("winnerText").innerText = `🏆 ${winner} Wins!`;
    document.getElementById("winnerScreen").style.display = "flex";
    clearInterval(countdownInterval);
}

// ================= DRAW =================
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

    const history = JSON.parse(localStorage.getItem("leaderboard")) || [];
    history.forEach(game => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${game.player1}</td><td>${game.player2}</td><td>${game.result}</td>`;
        tbody.appendChild(row);
    });
}

// ================= UTIL =================
function random() { return Math.floor(Math.random() * 6); }
function goHome() { window.location.href = "index.html"; }

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
function diceRollAnimation(finalRoll, targetElId, duration = 1000, intervalTime = 100) {
    const targetEl = document.getElementById(targetElId);
    if (!targetEl) return;

    let elapsed = 0;
    const animInterval = setInterval(() => {
        // Show random dice face
        targetEl.innerText = diceFaces[random()];
        elapsed += intervalTime;

        if (elapsed >= duration) {
            clearInterval(animInterval);
            // Show final roll
            targetEl.innerText = diceFaces[finalRoll];
        }
    }, intervalTime);
}
