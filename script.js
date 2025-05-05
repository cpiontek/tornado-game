let gameData = JSON.parse(localStorage.getItem('playTornadoGameData'));

let teamNames = {
  A: gameData?.teamA || 'Team A',
  B: gameData?.teamB || 'Team B'
};

let gridSize = parseInt(gameData?.gridSize) || 20;
let questions = [];
let currentIndex = 0;
let currentTeam = 'A';
let scores = { A: 0, B: 0 };

const scoreAEl = document.getElementById('scoreA');
const scoreBEl = document.getElementById('scoreB');
const teamANameEl = document.getElementById('team-a-name');
const teamBNameEl = document.getElementById('team-b-name');
const turnDisplay = document.getElementById('turnDisplay');
const questionEl = document.getElementById('question');
const answerEl = document.getElementById('answer');
const grid = document.getElementById('grid');
const endMsg = document.getElementById('endgame-message');

function initialize() {
  teamANameEl.textContent = teamNames.A;
  teamBNameEl.textContent = teamNames.B;

  if (gameData.questionSource === 'manual') {
    let raw = gameData.questions.trim();
    let blocks = raw.split(/\n\s*\n/);
    questions = blocks.map(b => {
      const [q, a] = b.trim().split('\n');
      return { q: q || '', a: a || '' };
    });
  } else {
    questions = Array.from({ length: gridSize }, (_, i) => ({
      q: `AI Question ${i + 1}`,
      a: `AI Answer ${i + 1}`
    }));
  }

  while (questions.length < gridSize) {
    questions.push(...questions);
  }
  questions = questions.slice(0, gridSize);

  drawGrid();
  updateUI();
}

function drawGrid() {
  grid.innerHTML = '';
  let cols = Math.ceil(Math.sqrt(gridSize));
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  for (let i = 0; i < gridSize; i++) {
    let btn = document.createElement('button');
    btn.textContent = i + 1;
    btn.onclick = () => handlePick(btn, i);
    grid.appendChild(btn);
  }
}

function updateUI() {
  scoreAEl.textContent = scores.A;
  scoreBEl.textContent = scores.B;
  turnDisplay.textContent = `${teamNames[currentTeam]}'s Turn`;
  const currentQ = questions[currentIndex];
  questionEl.textContent = currentQ.q;
  answerEl.textContent = '';
  endMsg.classList.add('hidden');
}

function handlePick(btn, index) {
  btn.disabled = true;
  const value = 100;
  scores[currentTeam] += value;
  answerEl.textContent = questions[index].a;
  updateUI();
  nextTurn();
}

function nextTurn() {
  currentTeam = currentTeam === 'A' ? 'B' : 'A';
  currentIndex = (currentIndex + 1) % questions.length;
  updateUI();
}

document.getElementById('passBtn').onclick = () => {
  currentTeam = currentTeam === 'A' ? 'B' : 'A';
  updateUI();
};

document.getElementById('skipBtn').onclick = () => {
  currentIndex = (currentIndex + 1) % questions.length;
  currentTeam = currentTeam === 'A' ? 'B' : 'A';
  updateUI();
};

document.getElementById('revealBtn').onclick = () => {
  answerEl.textContent = questions[currentIndex].a;
};

document.getElementById('resetBtn').onclick = () => {
  location.href = 'index.html';
};

initialize();
