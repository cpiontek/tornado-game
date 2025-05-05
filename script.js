// script.js
let gameData = JSON.parse(localStorage.getItem('playTornadoGameData')) || {};

const gridContainer = document.getElementById('grid');
const questionBox = document.getElementById('question-box');
const revealButton = document.getElementById('reveal-btn');
const answerBox = document.getElementById('answer-box');
const teamAScore = document.getElementById('team-a-score');
const teamBScore = document.getElementById('team-b-score');

let currentQuestionIndex = -1;
let revealedAnswers = new Set();
let questions = [];

function parseManualQuestions(raw) {
  return raw.split('\n\n').map(qb => {
    const [q, a] = qb.split('\n').map(s => s.trim());
    return { q, a };
  });
}

function generateGrid(num) {
  gridContainer.innerHTML = '';
  const cols = Math.ceil(Math.sqrt(num));
  gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  const effects = ['points', 'x2', 'steal', 'lose'];
  const values = [];
  for (let i = 0; i < num; i++) {
    const type = i < num * 0.8 ? 'points' : effects[Math.floor(Math.random() * (effects.length - 1)) + 1];
    const value = type === 'points' ? (Math.floor(Math.random() * 10) + 1) * 100 : type;
    values.push(value);
  }
  values.sort(() => Math.random() - 0.5);

  for (let i = 0; i < num; i++) {
    const btn = document.createElement('button');
    btn.textContent = i + 1;
    btn.className = 'grid-button';
    btn.dataset.index = i;
    btn.dataset.value = values[i];
    btn.disabled = false;
    btn.onclick = () => handleGridClick(i);
    gridContainer.appendChild(btn);
  }
}

function handleGridClick(index) {
  const button = document.querySelectorAll('.grid-button')[index];
  const value = button.dataset.value;

  if (typeof value === 'undefined') return;

  button.disabled = true;
  currentQuestionIndex = index;

  if (gameData.useQuestions && questions[index]) {
    questionBox.textContent = questions[index].q;
    answerBox.textContent = questions[index].a;
    answerBox.style.display = 'block';
    revealButton.style.display = 'none';
  } else {
    questionBox.textContent = `Box ${index + 1}`;
    answerBox.textContent = '';
    answerBox.style.display = 'none';
    revealButton.style.display = 'none';
  }

  let displayText = '';
  if (!isNaN(value)) {
    displayText = `+${value}`;
    addPoints('A', value);
  } else if (value === 'x2') {
    displayText = 'x2';
  } else if (value === 'steal') {
    displayText = '🌪️';
    playSound('wind');
  } else if (value === 'lose') {
    displayText = '❌';
    playSound('sad');
  }

  button.textContent = displayText;
}

function addPoints(team, points) {
  const el = team === 'A' ? teamAScore : teamBScore;
  let score = parseInt(el.textContent);
  score += parseInt(points);
  el.textContent = score;

  const pop = document.createElement('div');
  pop.className = 'score-popup ' + (team === 'A' ? 'team-a' : 'team-b');
  pop.textContent = `+${points}`;
  el.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}

function playSound(type) {
  let audio = new Audio();
  if (type === 'wind') {
    audio.src = 'sounds/wind.mp3';
  } else if (type === 'sad') {
    audio.src = 'sounds/sad.mp3';
  }
  audio.play();
}

function initGame() {
  if (!gameData || !gameData.gridSize) {
    questionBox.textContent = 'Game data missing. Please start from the homepage.';
    return;
  }

  if (gameData.questionSource === 'manual') {
    questions = parseManualQuestions(gameData.questions);
  } else {
    questions = Array(gameData.gridSize).fill().map((_, i) => ({
      q: `AI Question ${i + 1}`,
      a: `AI Answer ${i + 1}`
    }));
  }

  if (gameData.questionOrder === 'random') {
    questions.sort(() => Math.random() - 0.5);
  }

  gameData.useQuestions = questions.length > 0;

  document.getElementById('team-a-name').textContent = gameData.teamA;
  document.getElementById('team-b-name').textContent = gameData.teamB;
  generateGrid(gameData.gridSize);
}

initGame();
