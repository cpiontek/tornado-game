// script.js
let gameData = JSON.parse(localStorage.getItem('playTornadoGameData'));
const grid = document.getElementById('grid');
const questionEl = document.getElementById('question-box');
const answerBox = document.getElementById('answer-box');
const revealBtn = document.getElementById('reveal-btn');
const teamAEl = document.getElementById('team-a-name');
const teamBEl = document.getElementById('team-b-name');
const teamAScore = document.getElementById('team-a-score');
const teamBScore = document.getElementById('team-b-score');
const turnDisplay = document.getElementById('turnDisplay');
const passBtn = document.getElementById('pass-btn');
const skipBtn = document.getElementById('skip-btn');
const resetBtn = document.getElementById('reset-btn');
const endMessage = document.getElementById('endgame-message');

let currentTeam = 'A';
let score = { A: 0, B: 0 };
let questions = [];
let rewards = [];
let questionIndex = 0;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function parseQuestions(raw) {
  return raw.split('\n\n').map(pair => {
    const [q, a] = pair.split('\n');
    return { question: q.trim(), answer: a?.trim() || '' };
  });
}

function loadQuestions() {
  if (gameData.questionSource === 'manual') {
    questions = parseQuestions(gameData.questions);
  } else {
    questions = Array.from({ length: gameData.gridSize }, (_, i) => ({
      question: `AI Question ${i + 1}`,
      answer: `AI Answer ${i + 1}`
    }));
  }
  if (gameData.questionOrder === 'random') shuffle(questions);
  while (questions.length < gameData.gridSize) {
    questions.push(...questions);
  }
  questions = questions.slice(0, gameData.gridSize);
}

function generateRewards(size) {
  const specials = ['lose', 'steal', 'double'];
  const base = Array.from({ length: size }, () => ({
    type: 'points',
    value: (Math.floor(Math.random() * 10) + 1) * 100
  }));
  for (let i = 0; i < specials.length; i++) {
    base[i] = { type: specials[i] };
  }
  shuffle(base);
  return base;
}

function updateScores() {
  teamAScore.textContent = score.A;
  teamBScore.textContent = score.B;
}

function showQuestion() {
  const q = questions[questionIndex];
  questionEl.textContent = q.question;
  answerBox.textContent = '';
  answerBox.classList.add('hidden');
  revealBtn.classList.toggle('hidden', !q.answer);
  turnDisplay.textContent = `${currentTeam === 'A' ? gameData.teamA : gameData.teamB}'s turn`;
}

function revealAnswer() {
  const q = questions[questionIndex];
  answerBox.textContent = q.answer;
  answerBox.classList.remove('hidden');
}

function playSound(type) {
  const audio = new Audio(type === 'wind' ? './wind.mp3' : './sad.mp3');
  audio.play();
}

function handleClick(i, btn) {
  const reward = rewards[i];
  const color = currentTeam === 'A' ? 'red' : 'blue';

  if (reward.type === 'points') {
    score[currentTeam] += reward.value;
    btn.textContent = `+${reward.value}`;
  } else if (reward.type === 'double') {
    score[currentTeam] *= 2;
    btn.textContent = 'x2';
  } else if (reward.type === 'steal') {
    const other = currentTeam === 'A' ? 'B' : 'A';
    score[currentTeam] += score[other];
    score[other] = 0;
    btn.textContent = '🌪';
    playSound('wind');
  } else if (reward.type === 'lose') {
    score[currentTeam] = 0;
    btn.textContent = '❌';
    playSound('sad');
  }

  btn.disabled = true;
  btn.style.border = `3px solid ${color}`;
  btn.style.color = color;
  updateScores();
  revealAnswer();

  const allDone = [...grid.children].every(b => b.disabled);
  if (allDone) {
    endGame();
  } else {
    currentTeam = currentTeam === 'A' ? 'B' : 'A';
    questionIndex = (questionIndex + 1) % questions.length;
    showQuestion();
  }
}

function endGame() {
  let message = '';
  if (score.A > score.B) message = `${gameData.teamA} wins! 🎉`;
  else if (score.B > score.A) message = `${gameData.teamB} wins! 🎉`;
  else message = "It's a tie!";
  endMessage.textContent = message;
  endMessage.classList.remove('hidden');
  resetBtn.classList.remove('hidden');
}

function setupGrid() {
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(gameData.gridSize))}, 1fr)`;
  for (let i = 0; i < gameData.gridSize; i++) {
    const btn = document.createElement('button');
    btn.textContent = i + 1;
    btn.onclick = () => handleClick(i, btn);
    grid.appendChild(btn);
  }
}

passBtn.onclick = () => {
  currentTeam = currentTeam === 'A' ? 'B' : 'A';
  showQuestion();
};

skipBtn.onclick = () => {
  questionIndex = (questionIndex + 1) % questions.length;
  currentTeam = currentTeam === 'A' ? 'B' : 'A';
  showQuestion();
};

revealBtn.onclick = revealAnswer;

resetBtn.onclick = () => window.location.href = '/';

function startGame() {
  document.getElementById('gameScreen').classList.remove('hidden');
  teamAEl.textContent = gameData.teamA;
  teamBEl.textContent = gameData.teamB;
  score = { A: 0, B: 0 };
  updateScores();
  loadQuestions();
  rewards = generateRewards(gameData.gridSize);
  setupGrid();
  showQuestion();
}

startGame();
