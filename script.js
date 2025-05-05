// ─── FETCH FROM YOUR NETLIFY FUNCTION ─────────────────────────
async function fetchAIQuestions(topic, count) {
  const res = await fetch(
    `/.netlify/functions/generate-questions?topic=${encodeURIComponent(topic)}&count=${count}`
  );
  if (!res.ok) {
    throw new Error(`AI failed to generate questions. (${res.status})`);
  }
  const { data } = await res.json();
  // turn back into blocks separated by blank lines
  return data.map(q => `${q.question}\n${q.answer}`).join("\n\n");
}

// ─── DOM & GAME STATE ─────────────────────────────────────────
let rewards = [], scores = { A: 0, B: 0 }, picks = { A: 0, B: 0 },
    turn = "A", names = { A: "Team A", B: "Team B" },
    total = 20, questions = [], qIndex = 0;

const setupScreen   = document.getElementById("setupScreen"),
      gameScreen    = document.getElementById("gameScreen"),
      startBtn      = document.getElementById("startGameBtn"),
      resetBtn      = document.getElementById("resetBtn"),
      passBtn       = document.getElementById("passBtn"),
      skipBtn       = document.getElementById("skipBtn"),
      revealBtn     = document.getElementById("revealBtn"),
      gridEl        = document.getElementById("grid"),
      annA          = document.getElementById("annA"),
      annB          = document.getElementById("annB"),
      nameAEl       = document.getElementById("nameA"),
      nameBEl       = document.getElementById("nameB"),
      scoreAEl      = document.getElementById("scoreA"),
      scoreBEl      = document.getElementById("scoreB"),
      turnEl        = document.getElementById("turnDisplay"),
      questionEl    = document.getElementById("question"),
      answerEl      = document.getElementById("answer"),
      sourceRadios  = document.querySelectorAll('input[name="source"]'),
      aiLabel       = document.getElementById("aiTopicLabel");

sourceRadios.forEach(r =>
  r.onchange = () => aiLabel.classList.toggle("hidden", r.value !== "ai")
);

// ─── SETUP BUTTON ──────────────────────────────────────────────
startBtn.onclick = async () => {
  // read form
  names.A = document.getElementById("teamANameInput").value;
  names.B = document.getElementById("teamBNameInput").value;
  total   = +document.getElementById("gridSizeInput").value;

  const source = document.querySelector('input[name="source"]:checked').value;

  if (source === "ai") {
    const topic = document.getElementById("aiTopicInput").value.trim() || "General Knowledge";
    try {
      const raw = await fetchAIQuestions(topic, total);
      document.getElementById("questionsInput").value = raw;
    } catch (err) {
      return alert(err.message);
    }
  }

  parseQuestions();
  setupScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  initGame();
};

// ─── OTHER BUTTONS ────────────────────────────────────────────
resetBtn.onclick = initGame;
passBtn.onclick  = () => { turn = turn === "A" ? "B" : "A"; updateTurn(); showQuestion(); };
skipBtn.onclick  = () => { qIndex = (qIndex + 1) % questions.length; showQuestion(); };
revealBtn.onclick= () => {
  const ans = questions[qIndex].answer || "";
  answerEl.textContent = ans;
  answerEl.style.color = turn === "A" ? "var(--teamA)" : "var(--teamB)";
  answerEl.style.textAlign = turn === "A" ? "left" : "right";
};

// ─── PARSE & ORDER QUESTIONS ─────────────────────────────────
function parseQuestions() {
  const raw    = document.getElementById("questionsInput").value;
  const blocks = raw.split(/\n\s*\n/).map(b => b.trim()).filter(b => b);

  if (blocks[0].includes("\n")) {
    // Q&A blocks
    questions = blocks.map(b => {
      const [q, a] = b.split("\n");
      return { question: q.trim(), answer: a?.trim() || null };
    });
  } else {
    // one per line
    questions = raw.split("\n").map(l => ({ question: l.trim(), answer: null }));
  }

  if (document.querySelector('input[name="order"]:checked').value === "random") {
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
  }

  qIndex = 0;
}

// ─── INITIALIZE GAME ──────────────────────────────────────────
function initGame() {
  scores = { A: 0, B: 0 };
  picks  = { A: 0, B: 0 };
  annA.textContent = "";
  annB.textContent = "";
  nameAEl.textContent = names.A;
  nameBEl.textContent = names.B;
  updateScores();
  turn = "A";
  updateTurn();
  buildRewards(total);
  buildGrid(total);
  showQuestion();
}

// ─── BUILD REWARDS & GRID ────────────────────────────────────
function buildRewards(n) {
  const ptsBase   = Math.floor(n * 0.7),
        loseBase  = Math.floor(n * 0.1),
        stealBase = loseBase,
        dblBase   = n - (ptsBase + loseBase + stealBase),
        minSpec   = n >= 24 ? 3 : 2,
        loseCt    = Math.max(loseBase, minSpec),
        stealCt   = Math.max(stealBase, minSpec),
        dblCt     = Math.max(dblBase, minSpec),
        ptsCt     = n - (loseCt + stealCt + dblCt);

  rewards = [];
  for (let i = 0; i < ptsCt; i++)
    rewards.push({ type: "points", value: (Math.floor(Math.random() * 10) + 1) * 100 });
  for (let i = 0; i < loseCt; i++)  rewards.push({ type: "lose" });
  for (let i = 0; i < stealCt; i++) rewards.push({ type: "steal" });
  for (let i = 0; i < dblCt; i++)   rewards.push({ type: "double" });

  // shuffle
  for (let i = rewards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rewards[i], rewards[j]] = [rewards[j], rewards[i]];
  }
}

function buildGrid(n) {
  gridEl.innerHTML = "";
  let cols = Math.floor(Math.sqrt(n));
  if (cols < 2) cols = 2;
  gridEl.style.gridTemplateColumns = `repeat(${cols},1fr)`;

  for (let i = 0; i < n; i++) {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.onclick = () => handlePick(btn, i);
    gridEl.appendChild(btn);
  }
}

// ─── GRID CLICK ───────────────────────────────────────────────
function handlePick(btn, i) {
  let r = rewards[i], me = turn;
  if (picks[me] === 0 && r.type !== "points") {
    // first pick must be points
    r = { type: "points", value: (Math.floor(Math.random() * 10) + 1) * 100 };
  }
  picks[me]++;

  let out = "";
  if (r.type === "points") {
    scores[me] += r.value;
    out = "+" + r.value;
    btn.style.color = me === "A" ? "var(--teamA)" : "var(--teamB)";
  }
  else if (r.type === "lose") { scores[me] = 0; out = "☹️"; styleSpecial(btn, me); }
  else if (r.type === "steal") {
    const o = me === "A" ? "B" : "A";
    scores[me] += scores[o];
    scores[o] = 0;
    out = "🌪"; styleSpecial(btn, me);
  }
  else { // double
    scores[me] *= 2;
    out = "x2"; styleSpecial(btn, me);
  }

  if (me === "A") { annA.textContent = `${names.A} got ${out}`; annB.textContent = ""; }
  else           { annB.textContent = `${names.B} got ${out}`; annA.textContent = ""; }

  btn.textContent = out;
  btn.disabled    = true;
  updateScores();

  const done = document.querySelectorAll("#grid button:disabled").length;
  if (done === total) {
    if (scores.A > scores.B)      annA.textContent = `${names.A} wins! 🏆`;
    else if (scores.B > scores.A) annB.textContent = `${names.B} wins! 🏆`;
    else                           annA.textContent = "It's a tie!";
  } else {
    turn = me === "A" ? "B" : "A";
    updateTurn();
    showQuestion();
  }
}

// ─── SHOW QUESTION ────────────────────────────────────────────
function showQuestion() {
  const qObj = questions[qIndex] || { question: "", answer: null };
  questionEl.textContent     = qObj.question;
  questionEl.style.color     = turn === "A" ? "var(--teamA)" : "var(--teamB)";
  questionEl.style.textAlign = turn === "A" ? "left" : "right";
  answerEl.textContent       = "";
  revealBtn.classList.toggle("hidden", !qObj.answer);
}

// ─── UI HELPERS ───────────────────────────────────────────────
function updateScores() {
  scoreAEl.textContent = scores.A;
  scoreBEl.textContent = scores.B;
}

function updateTurn() {
  turnEl.textContent = `${names[turn]}'s turn`;
  turnEl.style.color = turn === "A" ? "var(--teamA)" : "var(--teamB)";
}

function styleSpecial(btn, team) {
  const clr = team === "A" ? "var(--teamA)" : "var(--teamB)";
  btn.style.background = clr;
  btn.style.color      = "#fff";
  btn.style.fontSize   = "2.5em";
}
