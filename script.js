const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

let players = [];
let currentPlayerIndex = 0;
let fixedDiceValues = [];

const MAX_TURNS = 5;
const ENERGY_DECREASE_PER_ROLL = 20;

let countdownInterval = null;
let timeLeft = 20;

function startGame() {

    const inputs = document.querySelectorAll(".player-input");
    const diceCount = parseInt(document.getElementById("fixedDiceCount").value);

    const playerNames = [];

    const nameRegex = /^[A-Za-z\s]{1,15}$/; 
    // Only letters and spaces, max 15 characters

    for (let input of inputs) {

        const name = input.value.trim();

        // Check empty
        if (name === "") {
            document.getElementById("error").innerText =
                "All player names are required!";
            return;
        }

        // Check length + only letters
        if (!nameRegex.test(name)) {
            document.getElementById("error").innerText =
                "Names must be letters only (max 15 characters, no numbers).";
            return;
        }

        playerNames.push(name);
    }

    // Minimum 2 players
    if (playerNames.length < 2) {
        document.getElementById("error").innerText =
            "Minimum 2 players required!";
        return;
    }

    // Check duplicate names (case insensitive)
    const lowerCaseNames = playerNames.map(n => n.toLowerCase());
    const uniqueNames = new Set(lowerCaseNames);

    if (uniqueNames.size !== playerNames.length) {
        document.getElementById("error").innerText =
            "Player names must be unique!";
        return;
    }

    // Clear error if everything valid
    document.getElementById("error").innerText = "";

    localStorage.setItem("players", JSON.stringify(playerNames));
    localStorage.setItem("diceCount", diceCount);

    window.location.href = "game.html";
}
/* ================= INIT GAME ================= */

function initGame() {
    const storedPlayers = JSON.parse(localStorage.getItem("players"));
    const diceCount = parseInt(localStorage.getItem("diceCount"));

    if (!storedPlayers || storedPlayers.length < 2) {
        window.location.href = "index.html";
        return;
    }

    // Generate fixed dice
    fixedDiceValues = [];
    for (let i = 0; i < diceCount; i++) {
        fixedDiceValues.push(random());
    }

    players = storedPlayers.map(name => ({
        name,
        stage: 0,
        energy: 100,
        turns: 0
    }));

    const playersContainer = document.getElementById("playersContainer");
    playersContainer.innerHTML = "";

    players.forEach((player, index) => {
        const playerCard = document.createElement("div");
        playerCard.classList.add("player-card");
        playerCard.id = `player${index}Card`;

        playerCard.innerHTML = `
            <h3>${player.name}</h3>
            <div class="energy-bar">
                <div class="energy-progress" id="player${index}Progress" style="width:${player.energy}%"></div>
            </div>
            <table id="player${index}Table" class="player-table">
                <thead>
                    <tr><th>Turn</th><th>Roll</th><th>Status</th></tr>
                </thead>
                <tbody></tbody>
            </table>
        `;
        playersContainer.appendChild(playerCard);
    });

    renderFixedDice();
    updateHighlight();
    startRollTimer();
    updateEnergyBars();
}

/* ================= RENDER FIXED DICE ================= */

function renderFixedDice() {

    const container = document.getElementById("progressContainer");
    container.innerHTML = "";

    fixedDiceValues.forEach((val, index) => {

        const box = document.createElement("div");
        box.classList.add("dice-box");

        box.innerHTML = `
            <div class="dice small-dice">
                ${diceFaces[val]}
            </div>
            <p>Fixed Dice ${index + 1}</p>
        `;

        container.appendChild(box);
    });
}
/* ================= ROLL ================= */

function rollDice() {
    clearInterval(countdownInterval);

    const diceEl = document.getElementById("rollingDice");
    const finalRoll = random();

    let rollingTime = 0;

    const animation = setInterval(() => {
        diceEl.innerText = diceFaces[random()];
        rollingTime += 100;

        if (rollingTime >= 1000) {
            clearInterval(animation);
            diceEl.innerText = diceFaces[finalRoll];
            handleRoll(finalRoll, currentPlayerIndex);
        }
    }, 100);
}

/* ================= MATCH LOGIC ================= */

function handleRoll(roll, playerIndex) {

    const player = players[playerIndex];
    const tableId = `player${playerIndex}Table`;
    const currentTarget = fixedDiceValues[player.stage];

    if (roll === currentTarget) {

        addToTable(
            tableId,
            "Bonus",
            diceFaces[roll],
            `Matched Stage ${player.stage + 1} ✅`
        );

        player.stage++;

        // ✅ WIN IMMEDIATELY IF COMPLETED ALL
        if (player.stage === fixedDiceValues.length) {
            finishGame(player.name);
            return;
        }

        // Bonus turn (same player continues)
        updateHighlight();
        startRollTimer();
        return;

    } else {

        addToTable(
            tableId,
            player.turns + 1,
            diceFaces[roll],
            "No Match ❌"
        );

        player.turns++;
        decreaseEnergy(player);
        player.stage = 0;

        nextPlayer();
    }

    updateEnergyBars();
    updateHighlight();
    checkMaxTurns();
    startRollTimer();
}

/* ================= NEXT PLAYER ================= */

function nextPlayer() {
    const totalPlayers = players.length;

    for (let i = 1; i <= totalPlayers; i++) {
        let nextIndex = (currentPlayerIndex + i) % totalPlayers;
        if (players[nextIndex].turns < MAX_TURNS) {
            currentPlayerIndex = nextIndex;
            return;
        }
    }

    checkMaxTurns(true);
}

/* ================= ENERGY ================= */

function decreaseEnergy(player) {
    player.energy -= ENERGY_DECREASE_PER_ROLL;
    if (player.energy < 0) player.energy = 0;
}

function updateEnergyBars() {
    players.forEach((player, index) => {
        const bar = document.getElementById(`player${index}Progress`);
        if (bar) bar.style.width = player.energy + "%";
    });
}

/* ================= ENDING ================= */

function checkMaxTurns(force = false) {

    if (force || players.every(p => p.turns >= MAX_TURNS)) {

        // If nobody completed full chain
        finishDraw();
    }
}

function finishGame(winner) {

    saveLeaderboard(`${winner} wins`);

    const winnerScreen = document.getElementById("winnerScreen");
    document.getElementById("winnerText").innerText =
        `🏆 ${winner} Wins!`;

    winnerScreen.classList.add("active");

    clearInterval(countdownInterval);
}

function finishDraw() {

    players.forEach(p => p.energy = 0);
    updateEnergyBars();

    saveLeaderboard("Game Draw");

    document.getElementById("drawScreen")
        .classList.add("active");

    clearInterval(countdownInterval);
}

/* ================= TABLE ================= */

function addToTable(tableId, turn, roll, status) {
    const tableBody =
        document.getElementById(tableId)?.querySelector("tbody");

    if (!tableBody) return;

    const row = document.createElement("tr");
    row.innerHTML = `<td>${turn}</td><td>${roll}</td><td>${status}</td>`;
    tableBody.appendChild(row);
}

/* ================= LEADERBOARD ================= */

function saveLeaderboard(result) {

    let history =
        JSON.parse(localStorage.getItem("leaderboard")) || [];

    history.unshift({
        players: players.map(p => p.name), // store as array
        result: result,
        date: new Date().toLocaleString()
    });

    localStorage.setItem("leaderboard",
        JSON.stringify(history));
}

function loadLeaderboard() {

    const tbody = document.getElementById("leaderboardBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const history =
        JSON.parse(localStorage.getItem("leaderboard")) || [];

    history.forEach(game => {

        const row = document.createElement("tr");

        let playerList = "";

        if (Array.isArray(game.players)) {
            playerList = game.players.join(", ");
        } else {
            playerList = game.players; // for old saved data
        }

        row.innerHTML = `
            <td>${playerList}</td>
            <td>${game.result}</td>
        `;

        tbody.appendChild(row);
    });
}

/* ================= TIMER ================= */

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

function random() {
    return Math.floor(Math.random() * 6);
}

function goHome() {
    window.location.href = "index.html";
}

function updateHighlight() {
    players.forEach((player, index) => {
        const card =
            document.getElementById(`player${index}Card`);
        if (!card) return;
        card.classList.toggle(
            "player-active",
            index === currentPlayerIndex
        );
    });
}