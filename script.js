const data = JSON.parse(localStorage.getItem('playTornadoGameData')) || {};
const teamAEl = document.getElementById('team-a-name');
const teamBEl = document.getElementById('team-b-name');
const teamAScoreEl = document.getElementById('team-a-score');
const teamBScoreEl = document.getElementById('team-b-score');
const turnIndicator = document.getElementById('turn-indicator');
const grid = document.getElementById('grid');
const questionBox = document.getElementById('question-box');
const answerBox = document.getElementById('answer-box');
const revealBtn = document.getElementById('reveal-btn');
const skipBtn = document.getElementById('skip-btn');
const passBtn = document.getElementById('pass-btn');

let currentTeam = 'A';
let questions = [];
let questionIndex = 0;
let usedBoxes = new Set();
let lastClickedBox = null;

function parseQuestions(input) {
  return input.split('\n\n').map(block => {
    const [q, a] = block.trim().split('\n');
    return { q: q?.trim(), a: a?.trim() };
  }).filter(q => q.q && q.a);
}

function shuffle(arr) {
  return arr.map(x => [Math.random(), x]).sort().map(x => x[1]);
}

function loopQuestionsToSize(size) {
  const extended = [];
  for (let i = 0; i < size; i++) {
    extended.push(questions[i % questions.length]);
  }
  return extended;
}

function updateTurnDisplay() {
  turnIndicator.textContent = `Current Turn: Team ${currentTeam}`;
}

function awardPoints(team, amount) {
  const el = team === 'A' ? teamAScoreEl : teamBScoreEl;
  el.textContent = parseInt(el.textContent) + amount;
}

function switchTeam() {
  currentTeam = currentTeam === 'A' ? 'B' : 'A';
  updateTurnDisplay();
}

function showNextQuestion() {
  questionBox.textContent = questions[questionIndex % questions.length].q;
  answerBox.textContent = questions[questionIndex % questions.length].a;
  answerBox.style.display = 'none';
  revealBtn.style.display = 'inline-block';
}

function generateGrid(n) {
  const cols = Math.ceil(Math.sqrt(n));
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  for (let i = 0; i < n; i++) {
    const btn = document.createElement('button');
    btn.className = 'grid-button';
    btn.textContent = i + 1;
    btn.onclick = () => handleBoxClick(btn);
    grid.appendChild(btn);
  }
}

function handleBoxClick(btn) {
  if (usedBoxes.has(btn)) return;

  lastClickedBox = btn;
  usedBoxes.add(btn);
  btn.disabled = true;
  btn.style.opacity = 0.5;

  showNextQuestion();
}

revealBtn.onclick = () => {
  answerBox.style.display = 'block';
  revealBtn.style.display = 'none';
  awardPoints(currentTeam, 100);
  questionIndex++;
  switchTeam();
};

skipBtn.onclick = () => {
  questionIndex++;
  switchTeam();
  showNextQuestion();
};

passBtn.onclick = () => {
  switchTeam(); // Don't increment question index
  showNextQuestion();
};

function initGame() {
  teamAEl.textContent = data.teamA || 'Team A';
  teamBEl.textContent = data.teamB || 'Team B';

  questions = data.questionSource === 'manual'
    ? parseQuestions(data.questions)
    : Array(data.gridSize).fill().map((_, i) => ({
        q: `AI Question ${i + 1}`, a: `AI Answer ${i + 1}`
      }));

  if (data.questionOrder === 'random') {
    questions = shuffle(questions);
  }

  questions = loopQuestionsToSize(data.gridSize);

  updateTurnDisplay();
  generateGrid(data.gridSize);
  showNextQuestion();
}

initGame();
