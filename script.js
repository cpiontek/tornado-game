// script.js — Enhanced with random point effects and sounds
let gameData = JSON.parse(localStorage.getItem('playTornadoGameData'));

const gridContainer = document.getElementById('grid');
const questionBox = document.getElementById('question-box');
const revealButton = document.getElementById('reveal-btn');
const answerBox = document.getElementById('answer-box');
const teamAScore = document.getElementById('team-a-score');
const teamBScore = document.getElementById('team-b-score');

let currentQuestionIndex = -1;
let questions = [];
let gridEffects = [];
let buttonsLocked = false;

const windSound = new Audio('wind.mp3');
const sadSound = new Audio('sad.mp3');

function parseManualQuestions(raw) {
  return raw.split('\n\n').map(qb => {
    const [q, a] = qb.split('\n').map(s => s.trim());
    return { q, a };
  });
}

function getRandomEffect() {
  const values = Array.from({ length: 10 }, (_, i) => ({ type: 'points', value: (i + 1) * 100 }));
  const effects = [
    { type: 'double' },
    { type: 'steal' },
    { type: 'lose' }
  ];
  return Math.random() < 0.7
    ? values[Math.floor(Math.random() * values.length)]
    : effects[Math.floor(Math.random() * effects.length)];
}

function generateGrid(num) {
  gridContainer.innerHTML = '';
  gridEffects = [];
  const cols = Math.ceil(Math.sqrt(num));
  gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  for (let i = 0; i < num; i++) {
    const effect = getRandomEffect();
    gridEffects.push(effect);
    const btn = document.createElement('button');
    btn.textContent = i + 1;
    btn.className = 'grid-button';
    btn.dataset.index = i;
    btn.onclick = () => handleGridClick(i, btn);
    gridContainer.appendChild(btn);
  }

  addSkipAndPassButtons();
}

function handleGridClick(index, button) {
  if (buttonsLocked || button.disabled) return;
  button.disabled = true;
  currentQuestionIndex = index;
  buttonsLocked = true;

  const effect = gridEffects[index];
  const currentTeam = Math.random() < 0.5 ? 'A' : 'B';
  let effectText = '';

  if (effect.type === 'points') {
    addPoints(currentTeam, effect.value);
    effectText = `+${effect.value}`;
  } else if (effect.type === 'double') {
    addPoints(currentTeam, 200);
    effectText = 'x2';
  } else if (effect.type === 'steal') {
    stealPoints(currentTeam, 100);
    windSound.play();
    effectText = '🌪️';
  } else if (effect.type === 'lose') {
    resetScore(currentTeam);
    sadSound.play();
    effectText = '❌';
  }

  button.textContent = effectText;

  if (gameData.useQuestions && questions[index]) {
    questionBox.textContent = questions[index].q;
    answerBox.textContent = questions[index].a;
    answerBox.style.display = 'block';
  } else {
    questionBox.textContent = `Box ${index + 1} selected.`;
    answerBox.textContent = '';
    answerBox.style.display = 'none';
  }

  questionBox.style.display = 'block';
  revealButton.style.display = 'none';
}

function addPoints(team, points) {
  const el = team === 'A' ? teamAScore : teamBScore;
  let score = parseInt(el.textContent);
  score += points;
  el.textContent = score;

  const pop = document.createElement('div');
  pop.textContent = `+${points}`;
  pop.className = 'score-popup ' + (team === 'A' ? 'team-a' : 'team-b');
  el.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}

function stealPoints(stealingTeam, amount) {
  const fromTeam = stealingTeam === 'A' ? 'B' : 'A';
  const fromEl = fromTeam === 'A' ? teamAScore : teamBScore;
  const toEl = stealingTeam === 'A' ? teamAScore : teamBScore;
  let fromScore = parseInt(fromEl.textContent);
  let toScore = parseInt(toEl.textContent);

  const stolen = Math.min(amount, fromScore);
  fromEl.textContent = fromScore - stolen;
  toEl.textContent = toScore + stolen;

  const stealPop = document.createElement('div');
  stealPop.textContent = `+${stolen}`;
  stealPop.className = 'score-popup ' + (stealingTeam === 'A' ? 'team-a' : 'team-b');
  toEl.appendChild(stealPop);
  setTimeout(() => stealPop.remove(), 1000);
}

function resetScore(team) {
  const el = team === 'A' ? teamAScore : teamBScore;
  el.textContent = '0';
  const pop = document.createElement('div');
  pop.textContent = '-ALL';
  pop.className = 'score-popup ' + (team === 'A' ? 'team-a' : 'team-b');
  el.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}

function addSkipAndPassButtons() {
  const skip = document.createElement('button');
  skip.textContent = '⏭️ Skip';
  skip.onclick = () => {
    questionBox.textContent = 'Question skipped.';
    answerBox.textContent = '';
    answerBox.style.display = 'none';
    buttonsLocked = false;
  };

  const pass = document.createElement('button');
  pass.textContent = '✅ Pass';
  pass.onclick = () => {
    questionBox.textContent = 'Point passed to other team.';
    answerBox.style.display = 'none';
    buttonsLocked = false;
  };

  gridContainer.parentNode.insertBefore(skip, gridContainer.nextSibling);
  gridContainer.parentNode.insertBefore(pass, skip.nextSibling);
}

function initGame() {
  if (gameData.useQuestions) {
    if (gameData.questionSource === 'manual') {
      questions = parseManualQuestions(gameData.questions);
    } else {
      questions = Array(gameData.gridSize).fill().map((_, i) => ({
        q: `AI Question ${i + 1}`,
        a: `AI Answer ${i + 1}`
      }));
    }
    if (gameData.questionOrder === 'random') {
      questions = questions.sort(() => Math.random() - 0.5);
    }
  }

  document.getElementById('team-a-name').textContent = gameData.teamA;
  document.getElementById('team-b-name').textContent = gameData.teamB;

  generateGrid(gameData.gridSize);
}

initGame();
