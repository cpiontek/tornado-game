let rewards = [];
let teamScores = { A: 0, B: 0 };
let currentTeam = "A";
let teamNames = { A: "Team A", B: "Team B" };

function startGame() {
  const gridSize = parseInt(document.getElementById("gridSize").value, 10);
  teamNames.A = document.getElementById("teamAName").value.trim() || "Team A";
  teamNames.B = document.getElementById("teamBName").value.trim() || "Team B";

  document.getElementById("nameA").textContent = teamNames.A;
  document.getElementById("nameB").textContent = teamNames.B;

  teamScores = { A: 0, B: 0 };
  updateScores();

  currentTeam = "A";
  updateTurnDisplay();

  generateRewards(gridSize);
  createGrid(gridSize);
}

function generateRewards(size) {
  rewards = [];
  const countPoints = Math.floor(size * 0.7);
  const countLose   = Math.floor(size * 0.1);
  const countSteal  = Math.floor(size * 0.1);
  const countDouble = size - (countPoints + countLose + countSteal);

  // points
  for (let i = 0; i < countPoints; i++) {
    const value = (Math.floor(Math.random() * 10) + 1) * 100;
    rewards.push({ type: "points", value });
  }
  // lose all
  for (let i = 0; i < countLose; i++) {
    rewards.push({ type: "lose" });
  }
  // steal
  for (let i = 0; i < countSteal; i++) {
    rewards.push({ type: "steal" });
  }
  // double
  for (let i = 0; i < countDouble; i++) {
    rewards.push({ type: "double" });
  }

  // Fisher–Yates shuffle
  for (let i = rewards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rewards[i], rewards[j]] = [rewards[j], rewards[i]];
  }
}

function createGrid(size) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let i = 0; i < size; i++) {
    const btn = document.createElement("button");
    btn.textContent = (i + 1).toString();
    btn.addEventListener("click", () => handleBoxClick(btn, i), { once: true });
    grid.appendChild(btn);
  }
}

function handleBoxClick(btn, index) {
  const reward = rewards[index];
  let display = "";

  if (reward.type === "points") {
    teamScores[currentTeam] += reward.value;
    display = `+${reward.value}`;
  } else if (reward.type === "lose") {
    teamScores[currentTeam] = 0;
    display = "☹️";
  } else if (reward.type === "steal") {
    const other = currentTeam === "A" ? "B" : "A";
    teamScores[currentTeam] += teamScores[other];
    teamScores[other] = 0;
    display = "🌪";
  } else if (reward.type === "double") {
    teamScores[currentTeam] *= 2;
    display = "x2";
  }

  btn.textContent = display;
  updateScores();

  currentTeam = currentTeam === "A" ? "B" : "A";
  updateTurnDisplay();
}

function updateScores() {
  document.getElementById("scoreA").textContent = teamScores.A;
  document.getElementById("scoreB").textContent = teamScores.B;
}

function updateTurnDisplay() {
  document.getElementById("turnDisplay").textContent = `${teamNames[currentTeam]}'s turn`;
}

function resetGame()
