// ─── DOM REFS ─────────────────────────────────────────────────────────────
const teamANameInput = document.getElementById("teamANameInput");
const teamBNameInput = document.getElementById("teamBNameInput");
const gridSizeInput  = document.getElementById("gridSizeInput");
const sourceRadios   = document.querySelectorAll('input[name="source"]');
const aiTopicInput   = document.getElementById("aiTopicInput");
const questionsInput = document.getElementById("questionsInput");
const orderRadios    = document.querySelectorAll('input[name="order"]');
const startBtn       = document.getElementById("startGameBtn");
const resetBtn       = document.getElementById("resetBtn");
const passBtn        = document.getElementById("passBtn");
const skipBtn        = document.getElementById("skipBtn");
const revealBtn      = document.getElementById("revealBtn");
const setupScreen    = document.getElementById("setupScreen");
const gameScreen     = document.getElementById("gameScreen");
const gridEl         = document.getElementById("grid");
const annA           = document.getElementById("annA");
const annB           = document.getElementById("annB");
const nameAEl        = document.getElementById("nameA");
const nameBEl        = document.getElementById("nameB");
const scoreAEl       = document.getElementById("scoreA");
const scoreBEl       = document.getElementById("scoreB");
const turnEl         = document.getElementById("turnDisplay");
const questionEl     = document.getElementById("question");
const answerEl       = document.getElementById("answer");
const aiLabel        = document.getElementById("aiTopicLabel");

// ─── TOGGLE AI‐TOPIC INPUT ─────────────────────────────────────────────────
sourceRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    aiLabel.style.display =
      radio.checked && radio.value === "ai" ? "block" : "none";
  });
});

// ─── SERVERLESS AI CALL ────────────────────────────────────────────────────
async function fetchAIQuestions(topic, count) {
  const url = `/.netlify/functions/generate-questions?topic=${encodeURIComponent(
    topic
  )}&count=${count}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AI API returned ${res.status}`);
  const { data } = await res.json(); // { data: [ {question,answer}, … ] }
  // convert back into our textarea Q&A blocks format:
  return data.map(item => `${item.question}\n${item.answer}`).join("\n\n");
}

// ─── STATE ─────────────────────────────────────────────────────────────────
let rewards = [],
    scores  = { A: 0, B: 0 },
    picks   = { A: 0, B: 0 },
    turn    = "A",
    names   = { A: "Team A", B: "Team B" },
    total   = 20,
    questions = [],
    qIndex  = 0;

// ─── PARSE QUESTIONS ────────────────────────────────────────────────────────
function parseQuestions() {
  const raw = questionsInput.value.trim();
  const blocks = raw.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  if (blocks.some(b => b.split("\n").length > 1)) {
    // Q&A blocks
    questions = blocks.map(b => {
      const [q,a] = b.split("\n");
      return { question: q.trim(), answer: a.trim() };
    });
  } else {
    // single‐line Qs
    questions = raw.split("\n").filter(Boolean).map(q => ({
      question: q.trim(),
      answer: null
    }));
  }
  // randomize if needed
  if (document.querySelector('input[name="order"]:checked').value === "random") {
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
  }
  qIndex = 0;
}

// ─── START GAME BUTTON ─────────────────────────────────────────────────────
startBtn.onclick = async () => {
  // capture names & grid size
  names.A = teamANameInput.value.trim() || "Team A";
  names.B = teamBNameInput.value.trim() || "Team B";
  total   = +gridSizeInput.value;

  // if AI source, fetch from function
  if (document.querySelector('input[name="source"]:checked').value === "ai") {
    try {
      questionsInput.value = "⏳ Generating questions via AI…";
      const aiText = await fetchAIQuestions(
        aiTopicInput.value.trim() || "General Knowledge",
        total
      );
      questionsInput.value = aiText;
    } catch (err) {
      console.error(err);
      alert("AI failed to generate questions. Try again later.");
      return;
    }
  }

  parseQuestions();
  setupScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  initGame();
};

// ─── HOOK UP OTHER CONTROLS ─────────────────────────────────────────────────
resetBtn.onclick = initGame;
passBtn.onclick  = () => { turn = turn==="A"?"B":"A"; updateTurn(); showQuestion(); };
skipBtn.onclick  = () => { qIndex = (qIndex+1) % questions.length; showQuestion(); };
revealBtn.onclick= () => {
  const ans = questions[qIndex].answer || "";
  answerEl.textContent    = ans;
  answerEl.style.color    = turn==="A" ? "var(--teamA)" : "var(--teamB)";
  answerEl.style.textAlign= turn==="A" ? "left"        : "right";
};

// ─── GAME INITIALIZATION ───────────────────────────────────────────────────
function initGame() {
  scores = { A:0, B:0 };
  picks  = { A:0, B:0 };
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

// ─── BUILD REWARDS ARRAY ───────────────────────────────────────────────────
function buildRewards(n) {
  const ptsBase   = Math.floor(n*0.7),
        loseBase  = Math.floor(n*0.1),
        stealBase = loseBase,
        dblBase   = n - (ptsBase + loseBase + stealBase),
        minSpec   = n>=24 ? 3 : 2,
        loseCount   = Math.max(loseBase, minSpec),
        stealCount  = Math.max(stealBase, minSpec),
        dblCount    = Math.max(dblBase,   minSpec),
        ptsCount    = n - (loseCount + stealCount + dblCount);

  rewards = [];
  for(let i=0;i<ptsCount;i++)    rewards.push({ type:"points", value: (Math.floor(Math.random()*10)+1)*100 });
  for(let i=0;i<loseCount;i++)   rewards.push({ type:"lose" });
  for(let i=0;i<stealCount;i++)  rewards.push({ type:"steal" });
  for(let i=0;i<dblCount;i++)    rewards.push({ type:"double" });

  // shuffle
  for(let i=rewards.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [rewards[i],rewards[j]] = [rewards[j],rewards[i]];
  }
}

// ─── BUILD THE GRID ────────────────────────────────────────────────────────
function buildGrid(n) {
  gridEl.innerHTML = "";
  let cols = Math.floor(Math.sqrt(n));
  if (cols < 2) cols = 2;
  gridEl.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  for(let i=0;i<n;i++){
    const btn = document.createElement("button");
    btn.textContent = i+1;
    btn.onclick = () => handlePick(btn,i);
    gridEl.appendChild(btn);
  }
}

// ─── HANDLE A GRID PICK ───────────────────────────────────────────────────
function handlePick(btn,i) {
  let r = rewards[i], me = turn;
  // first‐pick guarantee
  if (picks[me]===0 && r.type!=="points") {
    r = { type:"points", value: (Math.floor(Math.random()*10)+1)*100 };
  }
  picks[me]++;

  let out="";
  if (r.type==="points") {
    scores[me]+=r.value; out="+"+r.value;
    btn.style.color = me==="A"?"var(--teamA)":"var(--teamB)";
  } else if (r.type==="lose") {
    scores[me]=0; out="☹️"; styleSpecial(btn,me); playSad();
  } else if (r.type==="steal") {
    const o = me==="A"?"B":"A";
    scores[me]+=scores[o]; scores[o]=0;
    out="🌪"; styleSpecial(btn,me); playWind();
  } else {
    scores[me]*=2; out="x2"; styleSpecial(btn,me);
  }

  // announcement
  if (me==="A") { annA.textContent=`${names.A} got ${out}`; annB.textContent=""; }
  else          { annB.textContent=`${names.B} got ${out}`; annA.textContent=""; }

  btn.textContent = out;
  btn.disabled    = true;
  updateScores();

  // end‐of‐game?
  const done = document.querySelectorAll("#grid button:disabled").length;
  if (done === total) {
    if      (scores.A > scores.B) annA.textContent=`${names.A} wins! 🏆`;
    else if (scores.B > scores.A) annB.textContent=`${names.B} wins! 🏆`;
    else                          annA.textContent="It's a tie!";
  } else {
    turn = me==="A"?"B":"A";
    updateTurn();
    showQuestion();
  }
}

// ─── SHOW CURRENT QUESTION ─────────────────────────────────────────────────
function showQuestion() {
  const qObj = questions[qIndex] || { question:"", answer:null };
  questionEl.textContent   = qObj.question;
  questionEl.style.color   = turn==="A" ? "var(--teamA)": "var(--teamB)";
  questionEl.style.textAlign = turn==="A" ? "left" : "right";
  answerEl.textContent     = "";
  revealBtn.classList.toggle("hidden", !qObj.answer);
}

// ─── UPDATE SCORES & TURN DISPLAY ──────────────────────────────────────────
function updateScores(){
  scoreAEl.textContent = scores.A;
  scoreBEl.textContent = scores.B;
}
function updateTurn(){
  turnEl.textContent = `${names[turn]}'s turn`;
  turnEl.style.color = turn==="A"? "var(--teamA)": "var(--teamB)";
}

// ─── SPECIAL BUTTON STYLING & SOUNDS ───────────────────────────────────────
function styleSpecial(btn,team){
  const c = team==="A"? "var(--teamA)": "var(--teamB)";
  btn.style.background = c;
  btn.style.color      = "#fff";
  btn.style.fontSize   = "2.5em";
}
function playWind(){
  const C=new(window.AudioContext||window.webkitAudioContext)(),
        buf=C.createBuffer(1,C.sampleRate*0.5,C.sampleRate),
        d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const src=C.createBufferSource(),f=C.createBiquadFilter();
  src.buffer=buf; f.type='lowpass'; f.frequency.value=800;
  src.connect(f).connect(C.destination);
  src.start(); setTimeout(()=>src.stop(),500);
}
function playSad(){
  const C=new(window.AudioContext||window.webkitAudioContext)(),
        o=C.createOscillator(),g=C.createGain();
  o.type='triangle'; o.frequency.value=220;
  o.connect(g).connect(C.destination);
  o.start(); g.gain.setValueAtTime(1,C.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,C.currentTime+0.8);
  setTimeout(()=>o.stop(),800);
}
