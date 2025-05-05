// ── DOM refs ──────────────────────────────────────────
const setupScreen = document.getElementById('setupScreen');
const gameScreen  = document.getElementById('gameScreen');
const startBtn    = document.getElementById('startGameBtn');
const teamAName   = document.getElementById('teamAName');
const teamBName   = document.getElementById('teamBName');
const gridSizeSel = document.getElementById('gridSize');
const sourceEls   = document.querySelectorAll('input[name="source"]');
const aiTopicLabel= document.getElementById('aiTopicLabel');
const aiTopicIn   = document.getElementById('aiTopic');
const questionsIn = document.getElementById('questionsInput');
const orderEls    = document.querySelectorAll('input[name="order"]');

const annA    = document.getElementById('annA');
const annB    = document.getElementById('annB');
const nameA   = document.getElementById('nameA');
const nameB   = document.getElementById('nameB');
const scoreA  = document.getElementById('scoreA');
const scoreB  = document.getElementById('scoreB');
const turnEl  = document.getElementById('turnDisplay');
const questionEl = document.getElementById('question');
const answerEl   = document.getElementById('answer');
const passBtn    = document.getElementById('passBtn');
const skipBtn    = document.getElementById('skipBtn');
const revealBtn  = document.getElementById('revealBtn');
const gridEl     = document.getElementById('grid');
const resetBtn   = document.getElementById('resetBtn');

let questions = [], scores, picks, turn, total, names;

// ── toggle AI topic input ───────────────────────────
sourceEls.forEach(r => {
  r.addEventListener('change', () => {
    aiTopicLabel.classList.toggle('hidden', r.value !== 'ai');
  });
});

// ── start game ──────────────────────────────────────
startBtn.addEventListener('click', async e => {
  e.preventDefault();
  // basic
  names = {
    A: teamAName.value.trim() || 'Team A',
    B: teamBName.value.trim() || 'Team B'
  };
  total = parseInt(gridSizeSel.value,10)||20;

  // if AI
  if ( document.querySelector('input[name="source"]:checked').value === 'ai' ) {
    const topic = aiTopicIn.value.trim() || 'General Knowledge';
    try {
      const res = await fetch(`/.netlify/functions/generate-questions?topic=${encodeURIComponent(topic)}&count=${total}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      questions = json.data;
    } catch(err) {
      alert('AI failed to generate questions. Try again later.');
      return;
    }
  } else {
    parseManual();
  }

  setupScreen.classList.add('hidden');
  gameScreen .classList.remove('hidden');
  initGame();
});

function parseManual(){
  const raw = questionsIn.value;
  const blocks = raw.split(/\n\s*\n/).map(b=>b.trim()).filter(b=>b);
  if (blocks.some(b=>b.split('\n').length>1)) {
    questions = blocks.map(b => {
      const [q,a] = b.split('\n');
      return { question: q.trim(), answer: a?.trim()||null };
    });
  } else {
    questions = raw.split('\n').map(l=>l.trim()).filter(l=>l)
      .map(q=>({question: q.replace(/^\d+\.\s*/,''), answer: null}));
  }
  // random?
  if ( document.querySelector('input[name="order"]:checked').value === 'random' ) {
    for (let i=questions.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [questions[i],questions[j]] = [questions[j],questions[i]];
    }
  }
}

// ── set up game ─────────────────────────────────────
passBtn.onclick   = () => { switchTurn(); showQuestion(); };
skipBtn.onclick   = () => { qIndex=(qIndex+1)%questions.length; showQuestion(); };
revealBtn.onclick = () => {
  answerEl.textContent    = questions[qIndex].answer||'';
  answerEl.style.textAlign= turn==='A'? 'left':'right';
};
resetBtn.onclick  = initGame;

let qIndex;
function initGame(){
  scores={A:0,B:0};
  picks = {A:0,B:0};
  nameA.textContent = names.A;
  nameB.textContent = names.B;
  annA.textContent = annB.textContent = '';
  scoreA.textContent = scoreB.textContent = '0';
  turn='A'; qIndex=0;
  updateTurn();
  buildRewards(total);
  buildGrid(total);
  showQuestion();
}

function updateTurn(){
  turnEl.textContent = `${names[turn]}'s turn`;
  turnEl.style.color = turn==='A'? 'var(--teamA)' : 'var(--teamB)';
}
function switchTurn(){
  turn = turn==='A'? 'B':'A';
  updateTurn();
}

// ── grid & picking ──────────────────────────────────
let rewards=[];
function buildRewards(n){
  // same reward logic you had...
  const pts = Math.floor(n*0.7),
        lose = Math.floor(n*0.1),
        steal=lose,
        dbl  = n-(pts+lose+steal);
  rewards = [];
  for(let i=0;i<pts;i++)   rewards.push({type:'points',value:(Math.floor(Math.random()*10)+1)*100});
  for(let i=0;i<lose;i++)  rewards.push({type:'lose'});
  for(let i=0;i<steal;i++) rewards.push({type:'steal'});
  for(let i=0;i<dbl;i++)   rewards.push({type:'double'});
  // shuffle
  for(let i=rewards.length-1;i>0;i--){
    let j=Math.floor(Math.random()*(i+1));
    [rewards[i],rewards[j]]=[rewards[j],rewards[i]];
  }
}

function buildGrid(n){
  gridEl.innerHTML='';
  let cols = Math.max(2,Math.floor(Math.sqrt(n)));
  gridEl.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  for(let i=0;i<n;i++){
    const btn = document.createElement('button');
    btn.textContent = i+1;
    btn.onclick = ()=>handlePick(btn,i);
    gridEl.appendChild(btn);
  }
}

function handlePick(btn,i){
  let r = rewards[i], me=turn;
  if (picks[me]===0 && r.type!=='points') {
    r = { type:'points', value:(Math.floor(Math.random()*10)+1)*100 };
  }
  picks[me]++;

  let out;
  switch(r.type){
    case 'points':
      scores[me]+=r.value; out='+'+r.value;
      btn.style.color = me==='A'? 'var(--teamA)' : 'var(--teamB)';
      break;
    case 'lose':
      scores[me]=0; out='☹️'; styleSpecial(btn,me); break;
    case 'steal':
      const other = me==='A'? 'B':'A';
      scores[me]+=scores[other]; scores[other]=0;
      out='🌪'; styleSpecial(btn,me); break;
    default:
      scores[me]*=2; out='×2'; styleSpecial(btn,me);
  }

  annA.textContent = annB.textContent = '';
  if (me==='A') annA.textContent = `${names.A} got ${out}`;
  else           annB.textContent = `${names.B} got ${out}`;

  btn.textContent = out; btn.disabled = true;
  scoreA.textContent = scores.A;
  scoreB.textContent = scores.B;

  const done = document.querySelectorAll('#grid button:disabled').length;
  if (done === total) {
    if (scores.A>scores.B) annA.textContent = `${names.A} wins! 🏆`;
    else if (scores.B>scores.A) annB.textContent = `${names.B} wins! 🏆`;
    else annA.textContent = "It's a tie!";
  } else {
    switchTurn();
    showQuestion();
  }
}

// ── Q&A display ─────────────────────────────────────
function showQuestion(){
  const q = questions[qIndex]||{question:'',answer:null};
  questionEl.textContent = q.question;
  questionEl.style.textAlign = turn==='A'? 'left':'right';
  questionEl.style.color     = turn==='A'? 'var(--teamA)':'var(--teamB)';
  answerEl.textContent = '';
  revealBtn.classList.toggle('hidden', !q.answer);
}

function styleSpecial(btn,team){
  const c = team==='A'? 'var(--teamA)' : 'var(--teamB)';
  btn.style.background = c;
  btn.style.color      = '#fff';
  btn.style.fontSize   = '2rem';
}
