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
  easy:   { w: 8,  h: 10,  m: 12 },
  medium: { w: isMobile ? 8 : 9,  h: 10,  m: 16 },
  hard:   { w: isMobile ? 9 : 11, h: isMobile ? 10 : 11, m: 25 },
  ultra:  { w: isMobile ? 9 : 11, h: isMobile ? 30 : 33, m: 90 }
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

// ---------------- SCREEN SYSTEM ----------------
function showScreen(name) {
  document.getElementById("menu").classList.remove("active");
  document.getElementById("game").classList.remove("active");

  document.getElementById(name).classList.add("active");
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

function switchToSquareMode() {
  window.location.href = "index.html";
}

function getRowWidth(y) {
  return y % 2 === 0 ? width - 1 : width;
}

function isInBounds(x, y) {
  return y >= 0 && y < height && x >= 0 && x < getRowWidth(y);
}

function getNeighbors(x, y) {
  const evenRow = y % 2 === 0;
  const directions = evenRow
    ? [
        [-1, 0], // left
        [1, 0],  // right
        [0, -1], // up-left
        [1, -1], // up-right
        [0, 1],  // down-left
        [1, 1]   // down-right
      ]
    : [
        [-1, 0], // left
        [1, 0],  // right
        [-1, -1],// up-left
        [0, -1], // up-right
        [-1, 1], // down-left
        [0, 1]   // down-right
      ];

  return directions
    .map(([dx, dy]) => [x + dx, y + dy])
    .filter(([nx, ny]) => isInBounds(nx, ny));
}

function isSameOrNeighbor(x, y, sx, sy) {
  if (x === sx && y === sy) return true;
  return getNeighbors(sx, sy).some(([nx, ny]) => nx === x && ny === y);
}

// ---------------- START GAME ----------------
function startGame(level) {
  currentLevel = level;
  const cfg = configs[level];

  width = cfg.w;
  height = cfg.h;
  mines = cfg.m;
  boardDiv.style.setProperty("--cols", width);
  board = Array.from({ length: height }, (_, y) => Array(getRowWidth(y)).fill(0));
  revealed = Array.from({ length: height }, (_, y) => Array(getRowWidth(y)).fill(false));
  flagged = Array.from({ length: height }, (_, y) => Array(getRowWidth(y)).fill(false));

  firstClick = true;
  gameOver = false;

  document.getElementById("overlay").classList.add("hidden");
  setSmileyState("normal");

  showScreen("game");

  drawBoard();
}

// ---------------- MINES ----------------
function placeMines(sx, sy) {
  let placed = 0;

  while (placed < mines) {
    let y = Math.floor(Math.random() * height);
    let x = Math.floor(Math.random() * getRowWidth(y));

    if (board[y][x] === -1) continue;
    if (isSameOrNeighbor(x, y, sx, sy)) continue;

    board[y][x] = -1;
    placed++;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < getRowWidth(y); x++) {
      if (board[y][x] !== -1) {
        board[y][x] = countMines(x, y);
      }
    }
  }
}

function countMines(x, y) {
  let count = 0;

  for (let [nx, ny] of getNeighbors(x, y)) {
    if (board[ny][nx] === -1) count++;
  }

  return count;
}

// ---------------- REVEAL ----------------
function reveal(x, y) {
  if (!isInBounds(x, y)) return;
  if (revealed[y][x] || flagged[y][x]) return;

  revealed[y][x] = true;

  if (board[y][x] > 0) return;

  for (let [nx, ny] of getNeighbors(x, y)) {
    reveal(nx, ny);
  }
}

// ---------------- WIN CHECK ----------------
function checkWin() {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < getRowWidth(y); x++) {
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
  document.getElementById("overlay").classList.add("hidden");
  document.getElementById("overlay").removeEventListener("click", restartGame);
  showMenu();
}

// ---------------- REVEAL ALL ----------------
function revealAll() {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < getRowWidth(y); x++) {
      revealed[y][x] = true;
    }
  }
}

// ---------------- DRAW BOARD ----------------
function drawBoard() {
  boardDiv.innerHTML = "";

  for (let y = 0; y < height; y++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = `hex-row ${y % 2 === 0 ? 'even' : 'odd'}`;

    for (let x = 0; x < getRowWidth(y); x++) {
      const hex = document.createElement("div");
      hex.className = "hex";

      if (revealed[y][x]) {
        hex.classList.add("revealed");

        if (board[y][x] === -1) {
          hex.innerHTML = "💣";
          hex.classList.add("mine");

        } else if (board[y][x] > 0) {
          hex.innerHTML = board[y][x];
          hex.style.color = numberColors[board[y][x]];
        }

      } else if (flagged[y][x]) {
        hex.innerHTML = "🚩";
        hex.classList.add("flag");
      }

      if (!gameOver) {
        hex.addEventListener("click", () => handleClick(x, y));
        hex.addEventListener("contextmenu", (e) => handleRightClick(e, x, y));
      }

      rowDiv.appendChild(hex);
    }

    boardDiv.appendChild(rowDiv);
  }
}

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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Service Worker registered"))
      .catch((err) => console.log("SW failed:", err));
  });
}
