<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Tornado Game – Classroom & Trivia</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header>
    <img src="tornado.png" alt="Tornado" class="logo"/>
    <h1>Tornado Game</h1>
  </header>

  <!-- SETUP SCREEN -->
  <section id="setup">
    <div class="field">
      <label>Team A: <input id="teamAName" placeholder="Team A" /></label>
      <label>Team B: <input id="teamBName" placeholder="Team B" /></label>
      <label>Grid size:
        <select id="gridSize">
          <option>8</option>
          <option>16</option>
          <option selected>20</option>
          <option>24</option>
          <option>32</option>
          <option>40</option>
        </select>
      </label>
    </div>

    <div class="field">
      <label><input type="checkbox" id="useAI" /> Generate questions with AI</label>
      <input id="aiTopic" placeholder="Enter topic (e.g. ‘World capitals’)"/>
    </div>

    <div class="field">
      <label>Or paste your own questions (one per line OR Q&A pairs separated by blank line):</label>
      <textarea id="questions" placeholder="
What is the capital of France?
Paris

Which planet is called the Red Planet?
Mars
"></textarea>
    </div>

    <button id="startBtn">Start Game</button>
  </section>

  <!-- GAME SCREEN -->
  <section id="game" class="hidden">
    <div class="scores">
      <div class="card" id="cardA">
        <div id="annA" class="announcement"></div>
        <h2 id="nameA">Team A</h2>
        <div id="scoreA" class="points">0</div>
      </div>
      <div class="card" id="cardB">
        <div id="annB" class="announcement"></div>
        <h2 id="nameB">Team B</h2>
        <div id="scoreB" class="points">0</div>
      </div>
    </div>

    <h2 id="turnDisplay">Team A’s turn</h2>
    <div id="grid" class="grid"></div>

    <div class="controls">
      <button id="passBtn" class="small">Pass</button>
      <button id="skipBtn" class="small">Skip Q</button>
      <button id="revealBtn" class="small">Reveal Answer</button>
    </div>

    <button id="resetBtn">🔄 Reset Game</button>
  </section>

  <footer>
    <small>Created by Timothy Piontek</small>
  </footer>

  <script src="script.js"></script>
</body>
</html>
