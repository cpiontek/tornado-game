console.log("🚀 script.js loaded");
// -- State --
let rewards = [];
let teamScores = {A:0,B:0};
let turn = 'A';
let teamNames = {A:'Team A',B:'Team B'};

// -- Helpers --
function $(id){return document.getElementById(id);}
function rndInt(max){return Math.floor(Math.random()*max);}

// -- Start Game --
$('startBtn').onclick = () => {
  // read settings
  const size = parseInt($('gridSize').value,10);
  teamNames.A = $('teamAName').value.trim()||'Team A';
  teamNames.B = $('teamBName').value.trim()||'Team B';
  // init
  teamScores = {A:0,B:0};
  turn = 'A';
  $('announceA').textContent = '';
  $('announceB').textContent = '';
  $('nameA').textContent = teamNames.A;
  $('nameB').textContent = teamNames.B;
  renderScores();
  $('turnDisplay').textContent = `${teamNames[turn]}'s turn`;
  // build rewards & grid
  buildRewards(size);
  makeGrid(size);
};

// -- Reset --
$('resetBtn').onclick = () => window.location.reload();

// -- Build rewards array --
function buildRewards(n) {
  rewards = [];
  const types = ['points','double','steal','lose'];
  const dist = {
    points: Math.floor(n*0.6),
    double: 1,
    steal: 1,
    lose:   1,
  };
  // fill
  for(let i=0;i<dist.points;i++){
    const val = (rndInt(10)+1)*100;
    rewards.push({type:'points',value:val});
  }
  rewards.push({type:'double'},{type:'steal'},{type:'lose'});
  // shuffle
  for(let i=rewards.length-1;i>0;i--){
    const j=rndInt(i+1);
    [rewards[i], rewards[j]]=[rewards[j], rewards[i]];
  }
}

// -- Render the grid --
function makeGrid(n) {
  const grid = $('grid');
  grid.innerHTML = '';
  // set columns so it’s roughly square
  const cols = Math.ceil(Math.sqrt(n));
  grid.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  // create buttons
  for(let i=0;i<n;i++){
    const btn = document.createElement('button');
    btn.textContent = i+1;
    btn.onclick = ()=> handlePick(btn,i);
    grid.appendChild(btn);
  }
}

// -- Handle a pick --
function handlePick(btn,i){
  if(btn.classList.contains('used')) return;
  btn.classList.add('used');
  const r = rewards[i];
  let msg = '';
  // apply effect
  switch(r.type){
    case 'points':
      teamScores[turn] += r.value;
      msg = `+${r.value}`;
      break;
    case 'double':
      teamScores[turn] *= 2;
      msg = '×2';
      break;
    case 'steal':
      const other = turn==='A'?'B':'A';
      const stealAmt = teamScores[other];
      teamScores[turn] += stealAmt;
      teamScores[other] = 0;
      msg = '🌪';
      break;
    case 'lose':
      teamScores[turn] = 0;
      msg = '☹️';
      break;
  }
  // announce
  const ann = $('announce'+turn);
  ann.textContent = `${teamNames[turn]} got ${msg}`;
  // update displays
  renderScores();
  // check end
  if (i === rewards.length-1) return finishGame();
  // swap turn
  turn = turn==='A'?'B':'A';
  $('turnDisplay').textContent = `${teamNames[turn]}'s turn`;
}

// -- Render the two score cards --
function renderScores(){
  $('scoreA').textContent = teamScores.A;
  $('scoreB').textContent = teamScores.B;
}

// -- Finish --
function finishGame(){
  const winner = teamScores.A > teamScores.B ? 'A':'B';
  $('announce'+winner).textContent = `${teamNames[winner]} wins! 🏆`;
  $('turnDisplay').textContent = ``;
}


