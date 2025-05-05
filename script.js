// script.js
let gameData = JSON.parse(localStorage.getItem('playTornadoGameData'));
const gridContainer = document.getElementById('grid');
const questionBox = document.getElementById('question-box');
const answerBox = document.getElementById('answer-box');
const revealButton = document.getElementById('reveal-btn');
const teamAScore = document.getElementById('team-a-score');
const teamBScore = document.getElementById('team-b-score');
const turnIndicator = document.getElementById('turn-indicator');
const skipButton = document.getElementById('skip-btn');
const passButton = document.getElementById('pass-btn');

let currentTeam = 'A';
let currentQuestionIndex = -1;
let revealedAnswers = new Set();
let questions = [];
let usedQuestions = [];

function parseManualQuestions(raw) {
  return raw.split('\n\n').map(qb => {
    const [q, a] = qb.split('\n').map(s => s.trim());
    return { q, a };
  });
}

function loopQuestionsIfNeeded() {
  const needed = gameData.gridSize;
  const original = [...questions];
  while (questions.length < needed) {
    questions = questions.concat(original);
  }
  questions = questions.slice(0, needed);
}

function generateGrid(num) {
  gridContainer.innerHTML = '';
  const cols = Math.ceil(Math.sqrt(num));
  gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  for (let i = 0; i < num; i++) {
    const btn = document.createElement('button');
    btn.textContent = i + 1;
    btn.className = 'grid-button';
    btn.onclick = () => handleGridClick(i, btn);
    gridContainer.appendChild(btn);
  }
}

function handleGridClick(index, button) {
  currentQuestionIndex = index;
  const buttonEl = document.querySelectorAll('.grid-button')[index];
  buttonEl.disabled = true;

  const reward = gameData.rewards[index];
  let display = '';
  if (reward.type === 'points') {
    display = `+${reward.value}`;
    addPoints(currentTeam, reward.value);
  } else if (reward.type === 'double') {
    display = 'x2';
    addPoints(currentTeam, gameData.lastPoints * 2);
  } else if (reward.type === 'steal') {
    display = '🌪️';
    const stealAmount = currentTeam === 'A' ? parseInt(teamBScore.textContent) : parseInt(teamAScore.textContent);
    addPoints(currentTeam, stealAmount);
    if (currentTeam === 'A') teamBScore.textContent = 0;
    else teamAScore.textContent = 0;
    playWind();
  } else if (reward.type === 'lose') {
    display = '❌';
    if (currentTeam === 'A') teamAScore.textContent = 0;
    else teamBScore.textContent = 0;
    playSad();
  }

  button.textContent = display;
  button.style.border = `4px solid ${currentTeam === 'A' ? 'red' : 'blue'}`;
  button.style.color = currentTeam === 'A' ? 'red' : 'blue';

  const q = questions[index];
  questionBox.textContent = q.q;
  answerBox.textContent = q.a;
  answerBox.style.display = 'block';

  nextTurn();
}

function addPoints(team, points) {
  const el = team === 'A' ? teamAScore : teamBScore;
  let score = parseInt(el.textContent);
  score += points;
  el.textContent = score;
  gameData.lastPoints = points;
  const pop = document.createElement('div');
  pop.textContent = `+${points}`;
  pop.className = 'score-popup ' + (team === 'A' ? 'team-a' : 'team-b');
  el.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}

function playWind() {
  const audio = new Audio('sounds/wind.mp3');
  audio.play();
}

function playSad() {
  const audio = new Audio('sounds/sad.mp3');
  audio.play();
}

function nextTurn() {
  currentTeam = currentTeam === 'A' ? 'B' : 'A';
  turnIndicator.textContent = `Team ${currentTeam}'s Turn`;
  turnIndicator.style.color = currentTeam === 'A' ? 'red' : 'blue';
}

function initGame() {
  if (gameData.questionSource === 'manual') {
    questions = parseManualQuestions(gameData.questions);
  } else {
    questions = Array(gameData.gridSize).fill().map((_, i) => ({ q: `AI Question ${i + 1}`, a: `AI Answer ${i + 1}` }));
  }
  if (gameData.questionOrder === 'random') {
    questions = questions.sort(() => Math.random() - 0.5);
  }
  loopQuestionsIfNeeded();
  document.getElementById('team-a-name').textContent = gameData.teamA;
  document.getElementById('team-b-name').textContent = gameData.teamB;
  generateGrid(gameData.gridSize);
  currentTeam = 'A';
  turnIndicator.textContent = `Team ${currentTeam}'s Turn`;
  questionBox.textContent = questions[0].q;
  answerBox.textContent = questions[0].a;
  answerBox.style.display = 'block';
}

skipButton.onclick = () => {
  nextTurn();
  currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
  questionBox.textContent = questions[currentQuestionIndex].q;
  answerBox.textContent = questions[currentQuestionIndex].a;
};

passButton.onclick = () => {
  nextTurn();
};

document.getElementById('reveal-btn').onclick = () => {
  answerBox.style.display = 'block';
};

initGame();
