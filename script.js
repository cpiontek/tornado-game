let rewards = [];
let teamScores = { A: 0, B: 0 };
let currentTeam = "A";
let teamNames = { A: "Team A", B: "Team B" };

function startGame() {
  const gridSize = parseInt(document.getElementById("gridSize").value);
  teamNames.A = document.getElementById("teamAName").value || "Team A";
  teamNames.B = document.getElementById("teamBName").value || "Team B";

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
  const distribution = {
    points: Math.floor(size * 0.7),
    lose: Math.floor(size * 0.1),
    steal: Math.floor(size * 0.1),
    double: size - (Math.floor(size * 0.7) + Math.floor(size * 0.1) * 2),
  };

  for (let i = 0; i < distribution.points; i++) {
    const value = (Math.floor(Math.random() * 10) + 1) * 100;
    rewards.push({ type: "points", value });
  }
  for (let i = 0; i < distribution.lose; i++) {
    rewards.push({ type: "lose" });
  }
  for (let i = 0; i < distribution.steal; i++) {
    rewards.push({ type: "steal" });
  }
  for (let i = 0; i < distribution.double; i++) {
    rewards.push({ type: "double" });
  }

  // shuffle
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
    btn.textContent = i + 1;
    btn.onclick = () => handleBoxClick(btn, i);
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
  btn.disabled = true;
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

function resetGame() {
  startGame();
}
