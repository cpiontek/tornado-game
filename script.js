document.addEventListener('DOMContentLoaded', () => {
  const setupScreen   = document.getElementById('setupScreen');
  const gameScreen    = document.getElementById('gameScreen');
  const startBtn      = document.getElementById('startGameBtn');
  const resetBtn      = document.getElementById('resetBtn');
  const passBtn       = document.getElementById('passBtn');
  const skipBtn       = document.getElementById('skipBtn');
  const revealBtn     = document.getElementById('revealBtn');
  const gridEl        = document.getElementById('grid');
  const annA          = document.getElementById('annA');
  const annB          = document.getElementById('annB');
  const nameAEl       = document.getElementById('nameA');
  const nameBEl       = document.getElementById('nameB');
  const scoreAEl      = document.getElementById('scoreA');
  const scoreBEl      = document.getElementById('scoreB');
  const turnEl        = document.getElementById('turnDisplay');
  const questionEl    = document.getElementById('question');
  const answerEl      = document.getElementById('answer');
  const sourceRadios  = document.querySelectorAll('input[name="source"]');
  const aiLabel       = document.getElementById('aiTopicLabel');
  const topicInput    = document.getElementById('aiTopicInput');
  const questionsInput= document.getElementById('questionsInput');

  let scores = { A: 0, B: 0 };
  let picks  = { A: 0, B: 0 };
  let turn   = 'A';
  let names  = { A: 'Team A', B: 'Team B' };
  let total  = 20;
  let questions = [];
  let qIndex = 0;
  let rewards = [];

  sourceRadios.forEach(r => {
    r.addEventListener('change', () => {
      aiLabel.classList.toggle('hidden', r.value !== 'ai' || !r.checked);
    });
  });

  startBtn.onclick = async () => {
    names.A = document.getElementById('teamANameInput').value;
    names.B = document.getElementById('teamBNameInput').value;
    total   = +document.getElementById('gridSizeInput').value;

    const source = document.querySelector('input[name="source"]:checked').value;

    if (source === 'ai') {
      const topic = topicInput.value.trim() || 'General Knowledge';
      try {
        const res = await fetch(`/.netlify/functions/generate-questions?topic=${encodeURIComponent(topic)}&count=${total}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'AI failed.');
        const formatted = data.data.map(q => `${q.question}\n${q.answer}`).join('\n\n');
        questionsInput.value = formatted;
      } catch (err) {
        alert('AI failed to generate questions. Try again later.');
        return;
      }
    }

    parseQuestions();
    setupScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    initGame();
  };

  resetBtn.onclick = () => initGame();
  passBtn.onclick  = () => { turn = turn === 'A' ? 'B' : 'A'; updateTurn(); showQuestion(); };
  skipBtn.onclick  = () => { qIndex = (qIndex + 1) % questions.length; showQuestion(); };
  revealBtn.onclick = () => {
    const ans = questions[qIndex].answer || '';
    answerEl.textContent = ans;
    answerEl.style.color = turn === 'A' ? 'var(--teamA)' : 'var(--teamB)';
    answerEl.style.textAlign = turn === 'A' ? 'left' : 'right';
  };

  function parseQuestions() {
    const raw = questionsInput.value;
    const blocks = raw.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    if (blocks.some(b => b.includes('\n'))) {
      questions = blocks.map(b => {
        const [q, a] = b.split('\n');
        return { question: q.trim(), answer: a?.trim() || null };
      });
    } else {
      questions = blocks.map(q => ({ question: q, answer: null }));
    }

    const order = document.querySelector('input[name="order"]:checked').value;
    if (order === 'random') {
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }

    qIndex = 0;
  }

  function initGame() {
    scores = { A: 0, B: 0 };
    picks  = { A: 0, B: 0 };
    annA.textContent = '';
    annB.textContent = '';
    nameAEl.textContent = names.A;
    nameBEl.textContent = names.B;
    updateScores();
    turn = 'A';
    updateTurn();
    buildRewards(total);
    buildGrid(total);
    showQuestion();
  }

  function updateScores() {
    scoreAEl.textContent = scores.A;
    scoreBEl.textContent = scores.B;
  }

  function updateTurn() {
    turnEl.textContent = `${names[turn]}'s turn`;
    turnEl.style.color = turn === 'A' ? 'var(--teamA)' : 'var(--teamB)';
  }

  function buildGrid(n) {
    gridEl.innerHTML = '';
    const cols = Math.max(2, Math.floor(Math.sqrt(n)));
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    for (let i = 0; i < n; i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      btn.onclick = () => handlePick(btn, i);
      gridEl.appendChild(btn);
    }
  }

  function buildRewards(n) {
    const ptsBase = Math.floor(n * 0.7);
    const minSpec = n >= 24 ? 3 : 2;
    const loseCount = Math.max(Math.floor(n * 0.1), minSpec);
    const stealCount = loseCount;
    const dblCount = Math.max(n - (ptsBase + loseCount + stealCount), minSpec);
    const ptsCount = n - (loseCount + stealCount + dblCount);

    rewards = [];
    for (let i = 0; i < ptsCount; i++) rewards.push({ type: 'points', value: (Math.floor(Math.random() * 10) + 1) * 100 });
    for (let i = 0; i < loseCount; i++) rewards.push({ type: 'lose' });
    for (let i = 0; i < stealCount; i++) rewards.push({ type: 'steal' });
    for (let i = 0; i < dblCount; i++) rewards.push({ type: 'double' });

    for (let i = rewards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rewards[i], rewards[j]] = [rewards[j], rewards[i]];
    }
  }

  function showQuestion() {
    const q = questions[qIndex] || { question: '', answer: null };
    questionEl.textContent = q.question;
    questionEl.style.color = turn === 'A' ? 'var(--teamA)' : 'var(--teamB)';
    questionEl.style.textAlign = turn === 'A' ? 'left' : 'right';
    answerEl.textContent = '';
    revealBtn.classList.toggle('hidden', !q.answer);
  }

  function handlePick(btn, i) {
    let r = rewards[i];
    if (picks[turn] === 0 && r.type !== 'points') {
      r = { type: 'points', value: (Math.floor(Math.random() * 10) + 1) * 100 };
    }
    picks[turn]++;
    let out = '';
    if (r.type === 'points') {
      scores[turn] += r.value;
      out = '+' + r.value;
      btn.style.color = turn === 'A' ? 'var(--teamA)' : 'var(--teamB)';
    } else if (r.type === 'lose') {
      scores[turn] = 0;
      out = '☹️';
    } else if (r.type === 'steal') {
      const other = turn === 'A' ? 'B' : 'A';
      scores[turn] += scores[other];
      scores[other] = 0;
      out = '🌪';
    } else {
      scores[turn] *= 2;
      out = 'x2';
    }

    if (turn === 'A') {
      annA.textContent = `${names.A} got ${out}`;
      annB.textContent = '';
    } else {
      annB.textContent = `${names.B} got ${out}`;
      annA.textContent = '';
    }

    btn.textContent = out;
    btn.disabled = true;
    updateScores();

    const done = document.querySelectorAll('#grid button:disabled').length;
    if (done === total) {
      if (scores.A > scores.B) {
        annA.textContent = `${names.A} wins! 🏆`;
        annB.textContent = '';
      } else if (scores.B > scores.A) {
        annB.textContent = `${names.B} wins! 🏆`;
        annA.textContent = '';
      } else {
        annA.textContent = `It's a tie!`;
        annB.textContent = '';
      }
    } else {
      turn = turn === 'A' ? 'B' : 'A';
      updateTurn();
      showQuestion();
    }
  }
});
