const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

let currentPlayer = 1;
let fixed1, fixed2;

let player1Name = "";
let player2Name = "";

let bonusActive = false;

let p1Turns = 0;
let p2Turns = 0;

const MAX_TURNS = 5;

let firstMatchedDice = null;



function startGame() {
    playGame();
}

function playGame() {

    let p1 = document.getElementById("p1").value.trim();
    let p2 = document.getElementById("p2").value.trim();
    let error = document.getElementById("error");

    let regex = /^[A-Za-z ]+$/;

    error.innerText = "";

    if (p1 === "" || p2 === "") {
        error.innerText = "Names cannot be empty";
        return;
    }

    if (!regex.test(p1) || !regex.test(p2)) {
        error.innerText = "Names must contain only alphabets";
        return;
    }

    if (p1.toLowerCase() === p2.toLowerCase()) {
        error.innerText = "Names cannot be same";
        return;
    }

    localStorage.setItem("player1Name", p1);
    localStorage.setItem("player2Name", p2);

    window.location.href = "game.html";
}


function initGame() {

    player1Name = localStorage.getItem("player1Name");
    player2Name = localStorage.getItem("player2Name");

    if (!player1Name || !player2Name) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("player1Title").innerText = player1Name;
    document.getElementById("player2Title").innerText = player2Name;

    fixed1 = random();
    fixed2 = random();

    document.getElementById("dice1").innerText = diceFaces[fixed1];
    document.getElementById("dice2").innerText = diceFaces[fixed2];

    currentPlayer = 1;
    bonusActive = false;
    p1Turns = 0;
    p2Turns = 0;
    firstMatchedDice = null;

    updateChances();
    updateHighlight();
}



function rollDice() {

    let roll = random();
    let diceEl = document.getElementById("rollingDice");

    diceEl.style.transform = "rotate(360deg)";
    diceEl.style.transition = "0.3s";

    setTimeout(() => {
        diceEl.innerText = diceFaces[roll];
        diceEl.style.transform = "rotate(0deg)";
    }, 200);

    setTimeout(() => {

        let matched = (roll === fixed1 || roll === fixed2);

        if (currentPlayer === 1 && !bonusActive) p1Turns++;
        if (currentPlayer === 2 && !bonusActive) p2Turns++;

        if (currentPlayer === 1) {
            addResultRow("p1Table", matched ? "Matched ✅" : "Unmatched ❌");
        } else {
            addResultRow("p2Table", matched ? "Matched ✅" : "Unmatched ❌");
        }

        if (matched) {

            if (bonusActive) {
                if (roll !== firstMatchedDice) {
                    finishGame(currentPlayer === 1 ? player1Name : player2Name);
                    return;
                } else {
                    return;
                }
            }

            bonusActive = true;
            firstMatchedDice = roll;

            showBonus(currentPlayer === 1 ? player1Name : player2Name);

            updateChances();
            updateHighlight();
            return;

        } else {

            bonusActive = false;
            firstMatchedDice = null;

            currentPlayer = currentPlayer === 1 ? 2 : 1;
        }

        updateChances();

        if (p1Turns >= MAX_TURNS && p2Turns >= MAX_TURNS) {
            finishDraw();
            return;
        }

        updateHighlight();

    }, 300);
}



function addResultRow(tableId, result) {

    let table = document.getElementById(tableId);
    if (!table) return;

    let row = table.insertRow();
    let turnCell = row.insertCell(0);
    let resultCell = row.insertCell(1);

    let turnNumber = table.rows.length - 1;

    turnCell.innerText = turnNumber;
    resultCell.innerText = result;
}



function updateChances() {

    let remaining1 = MAX_TURNS - p1Turns;
    let remaining2 = MAX_TURNS - p2Turns;

    let el = document.getElementById("remainingChances");

    if (el) {
        el.innerText =
            player1Name + " Chances: " + remaining1 +
            " | " +
            player2Name + " Chances: " + remaining2;
    }
}



function showBonus(name) {

    let box = document.getElementById("bonusMsg");

    if (box) {
        box.innerText = "🔥 BONUS TURN : " + name;
        box.style.display = "block";

        setTimeout(() => {
            box.style.display = "none";
        }, 1500);
    }
}



function updateHighlight() {

    let p1Card = document.getElementById("p1Card");
    let p2Card = document.getElementById("p2Card");

    let turn1 = document.getElementById("turn1");
    let turn2 = document.getElementById("turn2");

    if (!p1Card || !p2Card) return;

    if (currentPlayer === 1) {

        p1Card.classList.add("player-active");
        p2Card.classList.remove("player-active");

        if (turn1) turn1.style.display = "inline-block";
        if (turn2) turn2.style.display = "none";

    } else {

        p2Card.classList.add("player-active");
        p1Card.classList.remove("player-active");

        if (turn2) turn2.style.display = "inline-block";
        if (turn1) turn1.style.display = "none";
    }
}


function finishDraw() {

    localStorage.setItem("todayWinner", "Draw");
    showWinnerScreen("🤝 Game Draw!");
}



function finishGame(winner) {

    localStorage.setItem("todayWinner", winner);

    let data = localStorage.getItem("allWins");
    let players = data ? data.split(",") : [];

    let found = false;

    for (let i = 0; i < players.length; i++) {

        let parts = players[i].split(":");
        let name = parts[0];
        let count = parseInt(parts[1]);

        if (name === winner) {
            count++;
            players[i] = name + ":" + count;
            found = true;
        }
    }

    if (!found) {
        players.push(winner + ":1");
    }

    localStorage.setItem("allWins", players.join(","));

    showWinnerScreen("🏆 " + winner + " Wins!");
}



function showWinnerScreen(text) {

    let screen = document.createElement("div");
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


function loadLeaderboard() {

    let todayEl = document.getElementById("todayWinner");
    let leaderEl = document.getElementById("allTimeLeader");

    if (!todayEl || !leaderEl) return;

    let today = localStorage.getItem("todayWinner");
    let allWins = localStorage.getItem("allWins");

    if (today) {
        todayEl.innerText = "Today Winner: " + today;
    }

    if (allWins) {

        let players = allWins.split(",");
        let topName = "";
        let maxWins = 0;

        players.forEach(player => {
            let parts = player.split(":");
            let name = parts[0];
            let wins = parseInt(parts[1]);

            if (wins > maxWins) {
                maxWins = wins;
                topName = name;
            }
        });

        leaderEl.innerText =
            "All Time Leader: " + topName + " (" + maxWins + " Wins)";
    }
}

function random() {
    return Math.floor(Math.random() * 6);
}