// script.js
let gameData = JSON.parse(localStorage.getItem('playTornadoGameData'));

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
  for (let i = 0; i < num; i++) {
    const btn = document.createElement('button');
    btn.textContent = i + 1;
    btn.className = 'grid-button';
    btn.onclick = () => handleGridClick(i);
    gridContainer.appendChild(btn);
  }
}

function handleGridClick(index) {
  currentQuestionIndex = index;
  const button = document.querySelectorAll('.grid-button')[index];
  button.disabled = true;

  if (gameData.useQuestions && questions[index]) {
    questionBox.textContent = questions[index].q;
    answerBox.textContent = questions[index].a;
    answerBox.style.display = 'block'; // auto-reveal
  } else {
    questionBox.textContent = `Pick a challenge! (Box ${index + 1})`;
    answerBox.textContent = '';
    answerBox.style.display = 'none';
  }
  questionBox.style.display = 'block';
  revealButton.style.display = 'none';
}

function initGame() {
  if (gameData.useQuestions) {
    if (gameData.questionSource === 'manual') {
      questions = parseManualQuestions(gameData.questions);
    } else {
      // Placeholder: Fetch AI-generated questions if implemented
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

// Score handling (you can trigger this elsewhere as needed)
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

initGame();
