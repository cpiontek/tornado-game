// script.js
let gameData = JSON.parse(localStorage.getItem('playTornadoGameData'));

const gridContainer = document.getElementById('grid');
const questionBox = document.getElementById('question-box');
const revealButton = document.getElementById('reveal-btn');
const answerBox = document.getElementById('answer-box');
const teamAScore = document.getElementById('team-a-score');
const teamBScore = document.getElementById('team-b-score');
const turnDisplay = document.getElementById('turn-display');
const passBtn = document.getElementById('pass-btn');
const skipBtn = document.getElementById('skip-btn');

let currentTeam = 'A';
let currentQuestionIndex = -1;
let revealedAnswers = new Set();
let usedQuestions = new Set();
let questions = [];

function playSound(type) {
  const audio = new Audio(type === 'wind' ? './wind.mp3' : './sad.mp3');
  audio.play();
}

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

  for (let i = 0; i < num; i++) {
    const btn = document.createElement('button');
    btn.textContent = i + 1;
    btn.className = 'grid-button';
    btn.onclick = () => handleGridClick(i, btn);
    gridContainer.appendChild(btn);
  }
}

function getNextQuestionIndex() {
  if (questions.length === 0) return -1;
  let newIndex = (currentQuestionIndex + 1) % questions.length;
  currentQuestionIndex = newIndex;
  return newIndex;
}

function displayQuestion() {
  const index = getNextQuestionIndex();
  if (questions[index]) {
    questionBox.textContent = questions[index].q;
    answerBox.textContent = '';
    answerBox.style.display = 'none';
    revealButton.classList.remove('hidden');
  }
  turnDisplay.textContent = `${gameData.teamA}'s Turn`;
  if (currentTeam === 'B') turnDisplay.textContent = `${gameData.teamB}'s Turn`;
}

function handleGridClick(index, button) {
  if (button.disabled) return;

  const reward = gameData.rewards[index];
  let teamScore = currentTeam === 'A' ? teamAScore : teamBScore;
  let teamColor = currentTeam === 'A' ? 'red' : 'blue';

  if (reward.type === 'points') {
    const value = reward.value;
    let score = parseInt(teamScore.textContent);
    score += value;
    teamScore.textContent = score;
    button.textContent = `+${value}`;
    button.style.color = '#fff';
    button.style.border = `3px solid ${teamColor}`;
    button.style.background = teamColor;
  } else if (reward.type === 'steal') {
    playSound('wind');
    let stealFrom = currentTeam === 'A' ? teamBScore : teamAScore;
    let stolenPoints = parseInt(stealFrom.textContent);
    let currentPoints = parseInt(teamScore.textContent);
    teamScore.textContent = currentPoints + stolenPoints;
    stealFrom.textContent = 0;
    button.textContent = '🌪️';
    button.style.border = `3px solid ${teamColor}`;
  } else if (reward.type === 'lose') {
    playSound('sad');
    teamScore.textContent = 0;
    button.textContent = '❌';
    button.style.border = `3px solid ${teamColor}`;
  } else if (reward.type === 'double') {
    let doubled = parseInt(teamScore.textContent) * 2;
    teamScore.textContent = doubled;
    button.textContent = 'x2';
    button.style.border = `3px solid ${teamColor}`;
  }

  // Reveal answer automatically
  if (questions[currentQuestionIndex]?.a) {
    answerBox.textContent = questions[currentQuestionIndex].a;
    answerBox.style.display = 'block';
  }

  button.disabled = true;
  currentTeam = currentTeam === 'A' ? 'B' : 'A';
  displayQuestion();
}

function addEventListeners() {
  revealButton.onclick = () => {
    if (questions[currentQuestionIndex]?.a) {
      answerBox.textContent = questions[currentQuestionIndex].a;
      answerBox.style.display = 'block';
    }
  };

  skipBtn.onclick = () => {
    currentTeam = currentTeam === 'A' ? 'B' : 'A';
    displayQuestion();
  };

  passBtn.onclick = () => {
    displayQuestion();
  };
}

function initializeGame() {
  document.getElementById('team-a-name').textContent = gameData.teamA;
  document.getElementById('team-b-name').textContent = gameData.teamB;

  if (gameData.questionSource === 'manual') {
    questions = parseManualQuestions(gameData.questions);
  }

  if (gameData.questionOrder === 'random') {
    questions = questions.sort(() => Math.random() - 0.5);
  }

  generateGrid(gameData.gridSize);
  displayQuestion();
  addEventListeners();
}

initializeGame();
