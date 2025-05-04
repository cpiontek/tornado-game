console.log('🚀 script.js loaded');

// — API KEY (replace below) —
const OPENAI_API_KEY = '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';

let rewards = [];
let teamScores = { A: 0, B: 0 };
let turn = 'A';
let teamNames = { A: 'Team A', B: 'Team B' };
let questions = [];
let qIndex = 0;

// — DOM Helpers —
const $ = id => document.getElementById(id);

// — Start / Reset —
function resetGame() {
  document.querySelector('#game').classList.add('hidden');
  document.querySelector('#setup').classList.remove('hidden');
}
function startGame() {
  // gather settings
  teamNames.A = $.teamAName.value.trim() || 'Team A';
  teamNames.B = $.teamBName.value.trim() || 'Team B';
  const size = parseInt($.gridSize.value, 10);
  turn = 'A';
  teamScores = { A: 0, B: 0 };
  qIndex = 0;
  $.annA.textContent = '';
  $.annB.textContent = '';

  // set up UI
  $.nameA.textContent = teamNames.A;
  $.nameB.textContent = teamNames.B;
  updateScores();
  updateTurn();

  // load questions
  if ($.useAI.checked && $.aiTopic.value.trim()) {
    generateAIQuestions($.aiTopic.value.trim(), size).then(arr => {
      questions = arr;
      _setupGrid(size);
    });
  } else {
    // parse textarea blocks
    const raw = $.questions.value.trim();
    if (raw) {
      // Q&A pairs separated by blank line OR single Q per line
      const blocks = raw.split(/\n{2,}/).map(b => b.trim());
      if (blocks[0].includes('\n')) {
        questions = blocks;
      } else {
        questions = blocks.join('\n').split(/\n+/).map(q => q);
      }
    } else {
      questions = [];
    }
    _setupGrid(size);
  }
}

// — Build the grid & rewards —
function _setupGrid(size) {
  // generate reward types
  rewards = [];
  const dist = {
    points: Math.floor(size * 0.7),
    lose: Math.floor(size * 0.1),
    steal: Math.floor(size * 0.1),
    double: size - (Math.floor(size*0.7) + Math.floor(size*0.1)*2)
  };
  for (let i=0; i<dist.points; i++) rewards.push({ type:'points', value:(rndInt(10)+1)*100 });
  for (let i=0; i<dist.lose;   i++) rewards.push({ type:'lose'   });
  for (let i=0; i<dist.steal;  i++) rewards.push({ type:'steal'  });
  for (let i=0; i<dist.double; i++) rewards.push({ type:'double' });

  // shuffle
  for (let i = rewards.length-1; i>0; i--) {
    const j = rndInt(i+1);
    [rewards[i], rewards[j]] = [rewards[j], rewards[i]];
  }

  // render buttons
  const grid = $.grid;
  grid.innerHTML = '';
  grid.dataset.size = size;
  for (let i=0; i<size; i++) {
    const btn = document.createElement('button');
    btn.textContent = i+1;
    btn.onclick = () => handleClick(btn, i);
    grid.appendChild(btn);
  }

  // switch screens
  document.querySelector('#setup').classList.add('hidden');
  document.querySelector('#game').classList.remove('hidden');
}

// — Handle a box click —
function handleClick(btn, idx) {
  if (btn.classList.contains('revealed')) return;
  // if Q&A mode, reveal question first
  const q = questions[qIndex % questions.length];
  if (q) {
    $.turnDisplay.style.color = turn==='A' ? 'crimson' : 'royalblue';
    $.turnDisplay.textContent = q;
    return;
  }
  // otherwise apply reward immediately
  revealReward(btn, idx);
}

// — Reveal reward & apply effects —
function revealReward(btn, idx) {
  const r = rewards[idx];
  btn.classList.add('revealed');
  let ann = '';
  switch(r.type) {
    case 'points':
      teamScores[turn] += r.value;
      ann = `+${r.value}`;
      break;
    case 'lose':
      teamScores[turn] = 0;
      ann = '☹️';
      break;
    case 'steal': {
      const other = turn==='A'?'B':'A';
      const stolen = teamScores[other];
      teamScores[turn] += stolen;
      teamScores[other] = 0;
      ann = '🌪️';
    } break;
    case 'double':
      teamScores[turn] *= 2;
      ann = '×2';
      break;
  }
  // annotate
  const targetAnn = turn==='A' ? $.annA : $.annB;
  targetAnn.textContent = ann;
  targetAnn.style.color = turn==='A'? 'crimson':'royalblue';

  updateScores();
  // next turn
  turn = turn==='A'?'B':'A';
  updateTurn();
}

// — Update UI helpers —
function updateScores() {
  $.scoreA.textContent = teamScores.A;
  $.scoreB.textContent = teamScores.B;
}
function updateTurn() {
  $.annA.textContent = '';
  $.annB.textContent = '';
  $.turnDisplay.textContent = `${teamNames[turn]}'s turn`;
  $.turnDisplay.style.color = turn==='A'? 'crimson':'royalblue';
}

// — AI question fetcher —
async function generateAIQuestions(topic, count) {
  const res = await fetch('https://api.openai.com/v1/chat/completions',{
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role:'system', content: 'Generate simple classroom trivia Q&A blocks.' },
        { role:'user', content:
          `Please give me ${count} questions about "${topic}". ` +
          `Format as blocks separated by a blank line, each block: first line question, second line answer.`
        }
      ]
    })
  });
  const j = await res.json();
  const text = j.choices[0].message.content.trim();
  return text.split(/\n{2,}/).map(b => b.trim());
}

// — Util —
function rndInt(max){ return Math.floor(Math.random()*max); }

// — Wire up buttons —
window.onload = () => {
  $.startBtn.onclick = startGame;
  $.resetBtn.onclick = resetGame;
  $.passBtn.onclick  = () => { turn = turn==='A'?'B':'A'; updateTurn(); };
  $.skipBtn.onclick  = () => { qIndex++; updateTurn(); };
  $.revealBtn.onclick= () => { qIndex++; updateTurn(); };
};
