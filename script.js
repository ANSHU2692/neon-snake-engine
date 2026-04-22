const board = document.querySelector(".board");
const startButton = document.querySelector(".btn-start");
const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");
const restartButton = document.querySelector(".btn-restart");
const highScoreElement = document.querySelector("#high-score");
const scoreElement = document.querySelector("#score");
const timeElement = document.querySelector("#time");

const blockSize = 40;

let highScore = localStorage.getItem("highScore") || 0;
let score = 0;
let time = "00-00";

highScoreElement.innerText = highScore;

const cols = Math.floor(board.clientWidth / blockSize);
const rows = Math.floor(board.clientHeight / blockSize);

let intervalId = null;
let timerIntervalId = null;

const blocks = [];

let snake;
let food;
let direction;

// Initialize game
function initGame() {
  snake = [{ x: 1, y: 3 }];
  direction = "right";
  score = 0;
  time = "00-00";

  scoreElement.innerText = score;
  timeElement.innerText = time;

  generateFood();
}

// Food generator (avoids snake)
function generateFood() {
  do {
    food = {
      x: Math.floor(Math.random() * rows),
      y: Math.floor(Math.random() * cols),
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
}

// Create grid
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const block = document.createElement("div");
    block.classList.add("block");
    board.appendChild(block);
    blocks[`${row},${col}`] = block;
  }
}

// Game Over
function gameOver() {
  clearInterval(intervalId);
  clearInterval(timerIntervalId);

  modal.style.display = "flex";
  startGameModal.style.display = "none";
  gameOverModal.style.display = "flex";
}

// Main render loop
function render() {
  let head = { ...snake[0] };

  if (direction === "left") head.y--;
  if (direction === "right") head.y++;
  if (direction === "up") head.x--;
  if (direction === "down") head.x++;

  // wall collision
  if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
    return gameOver();
  }

  // self collision
  if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  // food
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreElement.innerText = score;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
      highScoreElement.innerText = highScore;
    }

    generateFood();
  } else {
    snake.pop();
  }

  // clear board
  Object.values(blocks).forEach((block) => {
    block.classList.remove("fill", "food");
  });

  // draw food
  blocks[`${food.x},${food.y}`].classList.add("food");

  // draw snake
  snake.forEach((seg) => {
    blocks[`${seg.x},${seg.y}`].classList.add("fill");
  });
}

// Start Game
startButton.addEventListener("click", () => {
  modal.style.display = "none";
  initGame();

  clearInterval(intervalId);
  clearInterval(timerIntervalId);

  intervalId = setInterval(render, 200);

  timerIntervalId = setInterval(() => {
    let [min, sec] = time.split("-").map(Number);

    sec++;
    if (sec === 60) {
      min++;
      sec = 0;
    }

    time = `${String(min).padStart(2, "0")}-${String(sec).padStart(2, "0")}`;
    timeElement.innerText = time;
  }, 1000);
});

// Restart
restartButton.addEventListener("click", () => {
  modal.style.display = "none";
  startButton.click();
});

// Controls
addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" && direction !== "right") direction = "left";
  if (e.key === "ArrowRight" && direction !== "left") direction = "right";
  if (e.key === "ArrowUp" && direction !== "down") direction = "up";
  if (e.key === "ArrowDown" && direction !== "up") direction = "down";
});
