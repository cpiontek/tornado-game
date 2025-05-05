// script.js

// ─── GAME STATE & DOM ─────────────────────────────────────────
let questions = [], qIndex = 0;
let scores = { A: 0, B: 0 }, picks = { A: 0, B: 0 };
let turn = 'A';
let names = { A: 'Team A', B: 'Team B' };
let total = 20;

const setupScreen   = document.getElementById('setupScreen'),
      gameScreen    = document.getElementById('gameScreen'),
      startBtn      = document.getElementById('startGameBtn'),
      resetBtn      = document.getElementById('resetBtn'),
      passBtn       = document.getElementById('passBtn'),
      skipBtn       = document.getElementById('skipBtn'),
      revealBtn     = document.getElementById('revealBtn'),
      gridEl        = document.getElementById('grid'),
      annA          = document.getElementById('annA'),
      annB          = document.getElementById('annB'),
      nameAEl       = document.getElementById('nameA'),
      nameBEl       = document.getElementById('nameB'),
      scoreAEl      = document.getElementById('scoreA'),
      scoreBEl      = document.getElementById('scoreB'),
      turnEl        = document.getElementById('turnDisplay'),
      questionEl    = document.getElementById('question'),
      answerEl      = document.getElementById('answer'),
      sourceRadios  = document.querySelectorAll('input[name="source"]'),
      aiLabel       = document.getElementById('aiTopicLabel');

// toggle AI topic input visibility
sourceRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    aiLabel.classList.toggle('hidden', radio.value !== 'ai' || !radio.checked);
  });
});

// ─── START BUTTON ──────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  // 1) collect settings
  names.A = document.getElementById('teamANameInput').value.trim() || 'Team A';
  names.B = document.getElementById('teamBNameInput').value.trim() || 'Team B';
  total   = parseInt(document.getElementById('gridSizeInput').value, 10) || 20;

  // 2) if AI mode, try to fetch new blocks
  const source = document.querySelector('input[name="source"]:checked').value;
  if (source === 'ai') {
    const topic = document.getElementById('aiTopicInput').value.trim() || 'General Knowledge';
    try {
      const raw = await fetchAIQuestions(topic, total);
      document.getElementById('questionsInput').value = raw;
    } catch (err) {
      alert('AI is temporarily unavailable—please try again later.');
      console.error('AI error:', err);
    }
  }

  // 3) parse whatever is in the textarea now
  parseQuestions();

  // 4) switch screens & initialize
  setupScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  initGame();
});

// ─── FETCH AI QUESTIONS ────────────────────────────────────────
async function fetchAIQuestions(topic, count) {
  const url = `/.netlify/functions/generate-questions?topic=${encodeURIComponent(topic)}&count=${count}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Function returned HTTP ${res.status}`);
  }
  const payload = await res.json();
  // payload.data is an array of {question,answer}
  // convert back into "block" text (Q then A, blank line)
  return payload.data
    .map(q => `${q.question}\n${q.answer}`)
    .join('\n\n');
}

// ─── PARSE QUESTIONS ───────────────────────────────────────────
function parseQuestions() {
  const raw = document.getElementById('questionsInput').value.trim();
  const blocks = raw.split(/\n\s*\n/).map(b => b.trim()).filter(b => b);
  questions = blocks.map(b => {
    const [q, a] = b.split('\n');
    return { question: q.trim(), answer: (a||'').trim() };
  });
  // randomize?
  if (document.querySelector('input[name="order"]:checked').value === 'random') {
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
  }
  qIndex = 0;
}

// ─── INIT & GRID BUILD ────────────────────────────────────────
function initGame() {
  scores = { A: 0, B: 0 };
  picks  = { A: 0, B: 0 };
  annA.textContent = annB.textContent = '';
  nameAEl.textContent = names.A;
  nameBEl.textContent = names.B;
  turn = 'A'; updateTurn(); updateScores();
  buildRewards(total);
  buildGrid(total);
  showQuestion();
}

function buildGrid(n) {
  gridEl.innerHTML = '';
  let cols = Math.floor(Math.sqrt(n));
  if (cols < 2) cols = 2;
  gridEl.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  for (let i = 0; i < n; i++) {
    const btn = document.createElement('button');
    btn.textContent = i + 1;
    btn.addEventListener('click', () => handlePick(btn, i));
    gridEl.appendChild(btn);
  }
}

// ─── HANDLE A PICK ─────────────────────────────────────────────
function handlePick(btn, i) {
  const r = rewards[i];
  const me = turn;
  let out = '';

  if (r.type === 'points') {
    scores[me] += r.value;
    out = `+${r.value}`;
  } else if (r.type === 'lose') {
    scores[me] = 0;
    out = '☹️';
  } else if (r.type === 'steal') {
    const other = me === 'A' ? 'B' : 'A';
    scores[me] += scores[other];
    scores[other] = 0;
    out = '🌪';
  } else if (r.type === 'double') {
    scores[me] *= 2;
    out = '×2';
  }

  btn.textContent = out;
  btn.disabled   = true;
  updateScores();

  // announcement
  if (me === 'A') {
    annA.textContent = `${names.A} got ${out}`;
    annB.textContent = '';
  } else {
    annB.textContent = `${names.B} got ${out}`;
    annA.textContent = '';
  }

  // next turn or end?
  const done = gridEl.querySelectorAll('button:disabled').length;
  if (done === total) {
    if (scores.A > scores.B)      annA.textContent = `${names.A} wins! 🏆`;
    else if (scores.B > scores.A) annB.textContent = `${names.B} wins! 🏆`;
    else                           annA.textContent = `It's a tie!`;
  } else {
    turn = me === 'A' ? 'B' : 'A';
    updateTurn();
    showQuestion();
  }
}

// ─── QUESTION DISPLAY ──────────────────────────────────────────
function showQuestion() {
  const qObj = questions[qIndex] || { question: '', answer: '' };
  questionEl.textContent = qObj.question;
  questionEl.style.textAlign = turn === 'A' ? 'left' : 'right';
  questionEl.style.color = turn === 'A' ? 'var(--teamA)' : 'var(--teamB)';
  answerEl.textContent = '';
  revealBtn.classList.toggle('hidden', !qObj.answer);
}

passBtn.addEventListener('click', () => {
  turn = turn === 'A' ? 'B' : 'A';
  updateTurn();
  showQuestion();
});
skipBtn.addEventListener('click', () => {
  qIndex = (qIndex + 1) % questions.length;
  showQuestion();
});
revealBtn.addEventListener('click', () => {
  answerEl.textContent = questions[qIndex].answer;
  answerEl.style.textAlign = turn === 'A' ? 'left' : 'right';
  answerEl.style.color = turn === 'A' ? 'var(--teamA)' : 'var(--teamB)';
});

// ─── UTILS ─────────────────────────────────────────────────────
function updateScores() {
  scoreAEl.textContent = scores.A;
  scoreBEl.textContent = scores.B;
}
function updateTurn() {
  turnEl.textContent = `${names[turn]}'s turn`;
  turnEl.style.color = turn === 'A' ? 'var(--teamA)' : 'var(--teamB)';
}

// ─── REWARDS SHUFFLE ───────────────────────────────────────────
let rewards = [];
function buildRewards(n) {
  rewards = [];
  // simple equal mix: mostly points, a few other types…
  for (let i = 0; i < n; i++) {
    if (i < n * 0.7) rewards.push({ type: 'points', value: (Math.floor(Math.random() * 5) + 1) * 100 });
    else if (i < n * 0.8) rewards.push({ type: 'lose' });
    else if (i < n * 0.9) rewards.push({ type: 'steal' });
    else rewards.push({ type: 'double' });
  }
  // shuffle
  for (let i = rewards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rewards[i], rewards[j]] = [rewards[j], rewards[i]];
  }
}

// ─── RESET BUTTON ──────────────────────────────────────────────
resetBtn.addEventListener('click', initGame);
