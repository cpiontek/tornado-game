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
  const el
