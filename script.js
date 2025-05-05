const data = JSON.parse(localStorage.getItem('playTornadoGameData')) || {};
const teamAEl = document.getElementById('team-a-name');
const teamBEl = document.getElementById('team-b-name');
const teamAScoreEl = document.getElementById('team-a-score');
const teamBScoreEl = document.getElementById('team-b-score');
const turnIndicator = document.getElementById('turn-indicator');
const questionBox = document.getElementById('question-box');
const answerBox = document.getElementById('answer-box');
const grid = document.getElementById('grid');
const revealBtn = document.getElementById('reveal-btn');
const passBtn = document.getElementById('pass-btn');
const skipBtn = document.getElementById('skip-btn');
const resetBtn = document.getElementById('reset-button');
const celebrationEl = document.getElementById('celebration-message');

let currentTeam = 'A';
let scores = { A: 0, B: 0 };
let questions = [];
let questionIndex = 0;
let usedBoxes = new Set();
let currentQuestion = null;
let rewards = [];
let gridSize = data.gridSize || 20;

function parseQuestions(input) {
  const blocks = input.trim().split(/\n\s*\n/);
  return blocks.map(block => {
    const [q, a] = block.split('\n').map(s => s.trim());
    return { q, a };
  }).filter(q => q.q && q.a);
}

function loopQuestionsToSize(size) {
  const extended = [];
  for (let i = 0; i < size; i++) {
    extended.push(questions[i % questions.length]);
  }
  return extended;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildRewards(n) {
  const pointCount = Math.floor(n * 0.7);
  const specialCount = n - pointCount;
  const result = [];

  for (let i = 0; i < pointCount; i++) {
    result.push({ type: 'points', value: (Math.floor(Math.random() * 10) + 1) * 100 });
  }

  const specials = ['lose', 'steal', 'x2'];
  for (let i = 0; i < specialCount; i++) {
    result.push({ type: specials[i % specials.length] });
  }

  return shuffle(result);
}

function updateTurnDisplay() {
  turnIndicator.textContent = `Current Turn: Team ${currentTeam}`;
}

function switchTeam() {
  currentTeam = currentTeam === 'A' ? 'B' : 'A';
  updateTurnDisplay();
}

function updateScores() {
  teamAScoreEl.textContent = scores.A;
  teamBScoreEl.textContent = scores.B;
}

function playSound(type) {
  let audio;
  if (type === 'wind') {
    audio = new Audio('sounds/wind.mp3');
  } else if (type === 'sad') {
    audio = new Audio('sounds/sad.mp3');
  }
  if (audio) audio.play();
}

function handleEffect(effect, button) {
  let display = '';
  if (effect.type === 'points') {
    scores[currentTeam] += effect.value;
    display = `+${effect.value}`;
  } else if (effect.type === 'x2') {
    scores[currentTeam] *= 2;
    display = 'x2';
  } else if (effect.type === 'steal') {
    const other = currentTeam === 'A' ? 'B' : 'A';
    scores[currentTeam] += scores[other];
    scores[other] = 0;
    display = '🌪️';
    playSound('wind');
  } else if (effect.type === 'lose') {
    scores[currentTeam] = 0;
    display = '❌';
    playSound('sad');
  }

  button.textContent = display;
  updateScores();
}

function showQuestion(index) {
  currentQuestion = questions[index % questions.length];
  questionBox.textContent = currentQuestion.q;
  answerBox.textContent = currentQuestion.a;
  answerBox.style.display = 'none';
  revealBtn.style.display = 'inline-block';
}

function handleGridClick(button, index) {
  if (usedBoxes.has(index)) return;
  usedBoxes.add(index);
  button.disabled = true;

  const effect = rewards[index];
  handleEffect(effect, button);

  revealBtn.onclick = () => {
    answerBox.style.display = 'block';
    revealBtn.style.display = 'none';
  };

  checkGameOver();
}

function checkGameOver() {
  if (usedBoxes.size === gridSize) {
    let msg;
    if (scores.A > scores.B) msg = `${data.teamA} wins! 🏆`;
    else if (scores.B > scores.A) msg = `${data.teamB} wins! 🏆`;
    else msg = "It's a tie!";
    celebrationEl.textContent = msg;
    questionBox.textContent = '';
    answerBox.textContent = '';
    revealBtn.style.display = 'none';
    passBtn.disabled = true;
    skipBtn.disabled = true;
  } else {
    questionIndex++;
    switchTeam();
    showQuestion(questionIndex);
  }
}

function generateGrid(n) {
  grid.innerHTML = '';
  const cols = Math.ceil(Math.sqrt(n));
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  for (let i = 0; i < n; i++) {
    const btn = document.createElement('button');
    btn.className = 'grid-button';
    btn.textContent = i + 1;
    btn.onclick = () => handleGridClick(btn, i);
    grid.appendChild(btn);
  }
}

skipBtn.onclick = () => {
  questionIndex++;
  switchTeam();
  showQuestion(questionIndex);
};

passBtn.onclick = () => {
  switchTeam();
  showQuestion(questionIndex);
};

resetBtn.onclick = () => {
  window.location.reload();
};

function initGame() {
  scores = { A: 0, B: 0 };
  questionIndex = 0;
  usedBoxes = new Set();
  currentTeam = 'A';
  updateScores();
  updateTurnDisplay();
  celebrationEl.textContent = '';

  teamAEl.textContent = data.teamA || 'Team A';
  teamBEl.textContent = data.teamB || 'Team B';

  questions = data.questionSource === 'manual'
    ? parseQuestions(data.questions)
    : Array(gridSize).fill().map((_, i) => ({
        q: `AI Question ${i + 1}`,
        a: `AI Answer ${i + 1}`
      }));

  if (data.questionOrder === 'random') questions = shuffle(questions);
  questions = loopQuestionsToSize(gridSize);
  rewards = buildRewards(gridSize);

  generateGrid(gridSize);
  showQuestion(questionIndex);
}

initGame();
