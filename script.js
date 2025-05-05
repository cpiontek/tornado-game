const gameData = JSON.parse(localStorage.getItem('playTornadoGameData')) || {};

const gridContainer = document.getElementById('grid');
const questionBox = document.getElementById('question-box');
const answerBox = document.getElementById('answer-box');
const revealButton = document.getElementById('reveal-btn');
const skipButton = document.getElementById('skip-btn');
const passButton = document.getElementById('pass-btn');
const teamAScore = document.getElementById('team-a-score');
const teamBScore = document.getElementById('team-b-score');

let currentIndex = -1;
let questions = [];
let usedQuestions = [];

function parseManualQuestions(raw) {
  return raw.split('\n\n').map(qb => {
    const [q, a] = qb.split('\n').map(s => s.trim());
    return { q, a };
  }).filter(pair => pair.q && pair.a);
}

function loopQuestion(i) {
  return questions[i % questions.length];
}

function getRandomEffect() {
  const rand = Math.random();
  if (rand < 0.7) return { type: 'points', value: (Math.floor(Math.random() * 10) + 1) * 100 };
  if (rand < 0.85) return { type: 'x2' };
  if (rand < 0.95) return { type: 'steal' };
  return { type: 'lose' };
}

function generateGrid(size) {
  const cols = Math.ceil(Math.sqrt(size));
  gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gridContainer.innerHTML = '';

  for (let i = 0; i < size; i++) {
    const btn = document.createElement('button');
    btn.className = 'grid-button';
    btn.textContent = i + 1;
    const effect = getRandomEffect();
    btn.dataset.effect = JSON.stringify(effect);
    btn.onclick = () => handleGridClick(btn, i);
    gridContainer.appendChild(btn);
  }
}

function handleGridClick(button, i) {
  if (button.disabled) return;
  button.disabled = true;
  currentIndex = i;

  const effect = JSON.parse(button.dataset.effect);
  let display = '';

  const team = Math.random() < 0.5 ? 'A' : 'B';

  if (effect.type === 'points') {
    addPoints(team, effect.value);
    display = `+${effect.value}`;
  } else if (effect.type === 'x2') {
    addPoints(team, 200);
    display = 'x2';
  } else if (effect.type === 'steal') {
    stealPoints(team, 100);
    display = '🌪️';
    playSound('wind');
  } else if (effect.type === 'lose') {
    resetPoints(team);
    display = '❌';
    playSound('sad');
  }

  button.textContent = display;

  const q = loopQuestion(i);
  questionBox.textContent = q?.q || '';
  answerBox.textContent = q?.a || '';
  answerBox.style.display = 'none';
  revealButton.style.display = 'inline-block';
}

function addPoints(team, amount) {
  const el = team === 'A' ? teamAScore : teamBScore;
  const current = parseInt(el.textContent);
  el.textContent = current + amount;
}

function stealPoints(fromTeam, amount) {
  const toTeam = fromTeam === 'A' ? 'B' : 'A';
  const fromEl = fromTeam === 'A' ? teamAScore : teamBScore;
  const toEl = toTeam === 'A' ? teamAScore : teamBScore;

  const fromScore = parseInt(fromEl.textContent);
  const stolen = Math.min(fromScore, amount);
  fromEl.textContent = fromScore - stolen;
  toEl.textContent = parseInt(toEl.textContent) + stolen;
}

function resetPoints(team) {
  const el = team === 'A' ? teamAScore : teamBScore;
  el.textContent = 0;
}

function playSound(type) {
  const audio = new Audio();
  if (type === 'wind') audio.src = 'sounds/wind.mp3';
  if (type === 'sad') audio.src = 'sounds/sad.mp3';
  audio.play();
}

revealButton.onclick = () => {
  answerBox.style.display = 'block';
  revealButton.style.display = 'none';
};

skipButton.onclick = () => {
  questionBox.textContent = 'Skipped.';
  answerBox.style.display = 'none';
  revealButton.style.display = 'none';
};

passButton.onclick = () => {
  questionBox.textContent = 'Passed.';
  answerBox.style.display = 'none';
  revealButton.style.display = 'none';
};

function initGame() {
  if (!gameData || !gameData.gridSize) {
    questionBox.textContent = 'Missing game data. Please start from the homepage.';
    return;
  }

  document.getElementById('team-a-name').textContent = gameData.teamA;
  document.getElementById('team-b-name').textContent = gameData.teamB;

  questions = gameData.questionSource === 'manual'
    ? parseManualQuestions(gameData.questions)
    : Array(gameData.gridSize).fill().map((_, i) => ({
        q: `AI Question ${i + 1}`,
        a: `AI Answer ${i + 1}`
      }));

  if (gameData.questionOrder === 'random') {
    questions.sort(() => Math.random() - 0.5);
  }

  generateGrid(gameData.gridSize);
}

initGame();
