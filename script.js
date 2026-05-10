// ---------------- AUDIO ----------------
const boomSound = new Audio("boom.wav");
const pingSound = new Audio("ping.mp3");
const winSound = new Audio("win.mp3");

boomSound.volume = 0.6;
pingSound.volume = 0.4;
winSound.volume = 0.6;

// ---------------- CONFIG ----------------
let width, height, mines;
let board = [];
let revealed = [];
let flagged = [];
let firstClick = true;
let gameOver = false;
let currentLevel = "easy";
let smileyTimer = null;

const isMobile = window.innerWidth <= 600;

const configs = {
  easy:   { w: 8,  h: 8,  m: 10 },
  medium: { w: 10, h: 10, m: 15 },
  hard:   { w: 10, h: isMobile ? 13 : 14, m: 30 },
  ultra:  { w: 12, h: 42, m: 90 }
};

// ---------------- COLORS ----------------
const numberColors = {
  1: "#00f0ff",
  2: "#39ff14",
  3: "#ff004c",
  4: "#7a5cff",
  5: "#ff7a00",
  6: "#00ffd5",
  7: "#ffffff",
  8: "#aaaaaa"
};

const boardDiv = document.getElementById("board");

function showScreen(name) {
  document.getElementById("menu").classList.remove("active");
  document.getElementById("game").classList.remove("active");
  document.getElementById(name).classList.add("active");
}

function switchToHexagonMode() {
  window.location.href = "hexagon.html";
}

function showMenu() {
  showScreen("menu");
}

function showHowTo() {
  document.getElementById("helpOverlay").classList.remove("hidden");
}

function closeHelp() {
  document.getElementById("helpOverlay").classList.add("hidden");
}

// ---------------- START GAME ----------------
function startGame(level) {
  currentLevel = level;
  const cfg = configs[level];

  width = cfg.w;
  height = cfg.h;
  mines = cfg.m;

  board = Array(height).fill().map(() => Array(width).fill(0));
  revealed = Array(height).fill().map(() => Array(width).fill(false));
  flagged = Array(height).fill().map(() => Array(width).fill(false));

  firstClick = true;
  gameOver = false;

  document.getElementById("overlay").classList.add("hidden");
  setSmileyState("normal");

  showScreen("game");

  boardDiv.style.gridTemplateColumns = `repeat(${width}, 1fr)`;

  drawBoard();
}

// ---------------- MINES ----------------
function placeMines(sx, sy) {
  let placed = 0;

  while (placed < mines) {
    let x = Math.floor(Math.random() * width);
    let y = Math.floor(Math.random() * height);

    if (board[y][x] === -1) continue;
    if (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1) continue;

    board[y][x] = -1;
    placed++;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (board[y][x] !== -1) {
        board[y][x] = countMines(x, y);
      }
    }
  }
}

function countMines(x, y) {
  let count = 0;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      let nx = x + dx;
      let ny = y + dy;

      if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
        if (board[ny][nx] === -1) count++;
      }
    }
  }

  return count;
}

// ---------------- REVEAL ----------------
function reveal(x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  if (revealed[y][x] || flagged[y][x]) return;

  revealed[y][x] = true;

  if (board[y][x] > 0) return;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx !== 0 || dy !== 0) {
        reveal(x + dx, y + dy);
      }
    }
  }
}

// ---------------- WIN CHECK ----------------
function checkWin() {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (board[y][x] !== -1 && !revealed[y][x]) {
        return false;
      }
    }
  }
  return true;
}

// ---------------- CLICK ----------------
function handleClick(x, y) {
  if (gameOver) return;

  setSmileyState("surprised");
  if (smileyTimer) {
    clearTimeout(smileyTimer);
  }
  smileyTimer = setTimeout(() => {
    if (!gameOver) setSmileyState("normal");
  }, 250);

  if (firstClick) {
    placeMines(x, y);
    firstClick = false;
  }

  if (flagged[y][x]) return;

  // 💥 MINE HIT
  if (board[y][x] === -1) {
    gameOver = true;
    setSmileyState("dead");

    boomSound.currentTime = 0;
    boomSound.play();

    revealAll();
    drawBoard();

    showGameOver("GAME OVER 💥");
    return;
  }

  // SAFE TILE
  reveal(x, y);
  drawBoard();

  // 🎉 WIN CHECK
  if (checkWin()) {
    gameOver = true;
    setSmileyState("win");

    winSound.currentTime = 0;
    winSound.play();

    revealAll();
    drawBoard();

    showGameOver("YOU WIN 🎉");
  }
}

// ---------------- RIGHT CLICK ----------------
function handleRightClick(e, x, y) {
  e.preventDefault();
  if (gameOver) return;

  pingSound.currentTime = 0;
  pingSound.play();

  if (!revealed[y][x]) {
    flagged[y][x] = !flagged[y][x];
  }

  drawBoard();
}

// ---------------- GAME OVER ----------------
function showGameOver(text) {
  const overlay = document.getElementById("overlay");

  overlay.innerHTML = `
    <div>${text}</div>
    <div style="margin-top: 18px; font-size: 16px; color: #ffe600;">Click anywhere to restart.</div>
  `;

  overlay.classList.remove("hidden");
  overlay.addEventListener("click", restartGame);
}

function restartGame() {
  document.getElementById("overlay").removeEventListener("click", restartGame);
  document.getElementById("overlay").classList.add("hidden");
  showMenu();
}

// ---------------- REVEAL ALL ----------------
function setSmileyState(state) {
  const smiley = document.getElementById("smiley");
  if (!smiley) return;

  smiley.className = `smiley ${state}`;

  switch (state) {
    case "surprised":
      smiley.textContent = "😮";
      break;
    case "win":
      smiley.textContent = "😎";
      break;
    case "dead":
      smiley.textContent = "😵";
      break;
    default:
      smiley.textContent = "😃";
      break;
  }
}

function revealAll() {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      revealed[y][x] = true;
    }
  }
}

// ---------------- DRAW BOARD ----------------
function drawBoard() {
  boardDiv.innerHTML = "";

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (revealed[y][x]) {
        cell.classList.add("revealed");

        if (board[y][x] === -1) {
          cell.innerHTML = "💣";
          cell.classList.add("mine");

        } else if (board[y][x] > 0) {
          cell.innerHTML = board[y][x];
          cell.style.color = numberColors[board[y][x]];
        }

      } else if (flagged[y][x]) {
        cell.innerHTML = "🚩";
        cell.classList.add("flag");
      }

      if (!gameOver) {
        cell.addEventListener("click", () => handleClick(x, y));
        cell.addEventListener("contextmenu", (e) => handleRightClick(e, x, y));
      }

      boardDiv.appendChild(cell);
    }
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Service Worker registered"))
      .catch((err) => console.log("SW failed:", err));
  });
}