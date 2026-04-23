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

// ================= INIT =================
function initGame() {
  snake = [{ x: 1, y: 3 }];
  direction = "right";
  score = 0;
  time = "00-00";

  scoreElement.innerText = score;
  timeElement.innerText = time;

  updateSnakeColor();
  generateFood();
}

// ================= FOOD =================
function generateFood() {
  const foodTypes = [
    { type: "normal", points: 10, class: "food-normal" },
    { type: "bonus", points: 20, class: "food-bonus" },
    { type: "rare", points: 50, class: "food-rare" },
  ];

  const selected = foodTypes[Math.floor(Math.random() * foodTypes.length)];

  do {
    food = {
      x: Math.floor(Math.random() * rows),
      y: Math.floor(Math.random() * cols),
      ...selected,
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
}

// ================= PARTICLES =================
function createParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");

    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * 30;

    particle.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--y", `${Math.sin(angle) * distance}px`);

    particle.style.left = `${y * blockSize + blockSize / 2}px`;
    particle.style.top = `${x * blockSize + blockSize / 2}px`;

    board.appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
}

// ================= GRID =================
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const block = document.createElement("div");
    block.classList.add("block");
    board.appendChild(block);
    blocks[`${row},${col}`] = block;
  }
}

// ================= GAME OVER =================
function gameOver() {
  clearInterval(intervalId);
  clearInterval(timerIntervalId);

  modal.style.display = "flex";
  startGameModal.style.display = "none";
  gameOverModal.style.display = "flex";
}

// ================= COLOR =================
function updateSnakeColor() {
  const hue = Math.min(score * 2, 360);
  document.documentElement.style.setProperty(
    "--snake-color",
    `hsl(${hue}, 100%, 50%)`,
  );
}

// ================= RENDER =================
function render() {
  let head = { ...snake[0] };

  if (direction === "left") head.y--;
  if (direction === "right") head.y++;
  if (direction === "up") head.x--;
  if (direction === "down") head.x++;

  // Wall collision
  if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
    return gameOver();
  }

  // Self collision
  if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  // Food
  if (head.x === food.x && head.y === food.y) {
    score += food.points;
    createParticles(food.x, food.y);

    scoreElement.innerText = score;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
      highScoreElement.innerText = highScore;
    }

    updateSnakeColor();
    generateFood();
  } else {
    snake.pop();
  }

  // Clear board
  Object.values(blocks).forEach((block) => {
    block.classList.remove(
      "fill",
      "food",
      "food-normal",
      "food-bonus",
      "food-rare",
      "head",
      "left",
      "right",
      "up",
      "down",
    );
  });

  // Draw food
  blocks[`${food.x},${food.y}`].classList.add("food", food.class);

  // Draw snake
  snake.forEach((seg, index) => {
    const block = blocks[`${seg.x},${seg.y}`];
    block.classList.add("fill");

    if (index === 0) {
      block.classList.add("head", direction);
    }
  });
}

// ================= START =================
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

// ================= RESTART =================
restartButton.addEventListener("click", () => {
  modal.style.display = "none";
  startButton.click();
});

// ================= KEYBOARD =================
addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" && direction !== "right") direction = "left";
  if (e.key === "ArrowRight" && direction !== "left") direction = "right";
  if (e.key === "ArrowUp" && direction !== "down") direction = "up";
  if (e.key === "ArrowDown" && direction !== "up") direction = "down";
});

// ================= TOUCH =================
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 30;

board.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

board.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance)
    return;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0 && direction !== "left") direction = "right";
    else if (dx < 0 && direction !== "right") direction = "left";
  } else {
    if (dy > 0 && direction !== "up") direction = "down";
    else if (dy < 0 && direction !== "down") direction = "up";
  }

  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

// const board = document.querySelector(".board");
// const startButton = document.querySelector(".btn-start");
// const modal = document.querySelector(".modal");
// const startGameModal = document.querySelector(".start-game");
// const gameOverModal = document.querySelector(".game-over");
// const restartButton = document.querySelector(".btn-restart");
// const highScoreElement = document.querySelector("#high-score");
// const scoreElement = document.querySelector("#score");
// const timeElement = document.querySelector("#time");

// const blockSize = 40;

// let highScore = localStorage.getItem("highScore") || 0;
// let score = 0;
// let time = "00-00";

// highScoreElement.innerText = highScore;

// const cols = Math.floor(board.clientWidth / blockSize);
// const rows = Math.floor(board.clientHeight / blockSize);

// let intervalId = null;
// let timerIntervalId = null;

// const blocks = [];

// let snake;
// let food;
// let direction;

// // Initialize game
// function initGame() {
//   snake = [{ x: 1, y: 3 }];
//   direction = "right";
//   score = 0;
//   time = "00-00";

//   scoreElement.innerText = score;
//   timeElement.innerText = time;

//   generateFood();
// }

// // Food generator (avoids snake)
// // function generateFood() {
// //   do {
// //     food = {
// //       x: Math.floor(Math.random() * rows),
// //       y: Math.floor(Math.random() * cols),
// //     };
// //   } while (snake.some((s) => s.x === food.x && s.y === food.y));
// // }

// function generateFood() {
//   const foodTypes = [
//     { type: "normal", points: 10, class: "food-normal" },
//     { type: "bonus", points: 20, class: "food-bonus" },
//     { type: "rare", points: 50, class: "food-rare" },
//   ];

//   const selected = foodTypes[Math.floor(Math.random() * foodTypes.length)];

//   do {
//     food = {
//       x: Math.floor(Math.random() * rows),
//       y: Math.floor(Math.random() * cols),
//       ...selected,
//     };
//   } while (snake.some((s) => s.x === food.x && s.y === food.y));
// }

// function createParticles(x, y) {
//   for (let i = 0; i < 8; i++) {
//     const particle = document.createElement("div");
//     particle.classList.add("particle");

//     const angle = Math.random() * 2 * Math.PI;
//     const distance = Math.random() * 30;

//     particle.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
//     particle.style.setProperty("--y", `${Math.sin(angle) * distance}px`);

//     const rect = board.getBoundingClientRect();
//     particle.style.left = `${y * blockSize + blockSize / 2}px`;
//     particle.style.top = `${x * blockSize + blockSize / 2}px`;

//     board.appendChild(particle);

//     setTimeout(() => particle.remove(), 500);
//   }
// }

// // Create grid
// for (let row = 0; row < rows; row++) {
//   for (let col = 0; col < cols; col++) {
//     const block = document.createElement("div");
//     block.classList.add("block");
//     board.appendChild(block);
//     blocks[`${row},${col}`] = block;
//   }
// }

// // Game Over
// function gameOver() {
//   clearInterval(intervalId);
//   clearInterval(timerIntervalId);

//   modal.style.display = "flex";
//   startGameModal.style.display = "none";
//   gameOverModal.style.display = "flex";
// }

// function updateSnakeColor() {
//   const hue = Math.min(score * 2, 360);
//   document.documentElement.style.setProperty(
//     "--snake-color",
//     `hsl(${hue}, 100%, 50%)`,
//   );
// }

// // Main render loop
// function render() {
//   let head = { ...snake[0] };

//   if (direction === "left") head.y--;
//   if (direction === "right") head.y++;
//   if (direction === "up") head.x--;
//   if (direction === "down") head.x++;

//   // wall collision
//   if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
//     return gameOver();
//   }

//   // self collision
//   if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
//     return gameOver();
//   }

//   snake.unshift(head);

//   // food
//   if (head.x === food.x && head.y === food.y) {
//     //score += 10;

//     score += food.points;

//     createParticles(food.x, food.y);

//     scoreElement.innerText = score;

//     if (score > highScore) {
//       highScore = score;
//       localStorage.setItem("highScore", highScore);
//       highScoreElement.innerText = highScore;
//     }

//     updateSnakeColor();
//     generateFood();
//   } else {
//     snake.pop();
//   }

//   // clear board
//   Object.values(blocks).forEach((block) => {
//     block.classList.remove(
//       "fill",
//       "food",
//       "food-normal",
//       "food-bonus",
//       "food-rare",
//       "head",
//       "left",
//       "right",
//       "up",
//       "down",
//     );
//   });

//   // draw food
//   // blocks[`${food.x},${food.y}`].classList.add("food");
//   blocks[`${food.x},${food.y}`].classList.add("food", food.class);

//   // draw snake
//   // snake.forEach((seg) => {
//   //   blocks[`${seg.x},${seg.y}`].classList.add("fill");
//   // });

//   snake.forEach((seg, index) => {
//     const block = blocks[`${seg.x},${seg.y}`];
//     block.classList.add("fill");

//     if (index === 0) {
//       block.classList.add("head", direction); // 👈 direction class added
//     }
//   });
// }

// // Start Game
// startButton.addEventListener("click", () => {
//   modal.style.display = "none";
//   initGame();

//   clearInterval(intervalId);
//   clearInterval(timerIntervalId);

//   intervalId = setInterval(render, 200);

//   timerIntervalId = setInterval(() => {
//     let [min, sec] = time.split("-").map(Number);

//     sec++;
//     if (sec === 60) {
//       min++;
//       sec = 0;
//     }

//     time = `${String(min).padStart(2, "0")}-${String(sec).padStart(2, "0")}`;
//     timeElement.innerText = time;
//   }, 1000);
// });

// // Restart
// restartButton.addEventListener("click", () => {
//   modal.style.display = "none";
//   startButton.click();
// });

// // Controls
// addEventListener("keydown", (e) => {
//   if (e.key === "ArrowLeft" && direction !== "right") direction = "left";
//   if (e.key === "ArrowRight" && direction !== "left") direction = "right";
//   if (e.key === "ArrowUp" && direction !== "down") direction = "up";
//   if (e.key === "ArrowDown" && direction !== "up") direction = "down";
// });

// // ================= MOBILE TOUCH CONTROLS =================

// let touchStartX = 0;
// let touchStartY = 0;
// let touchEndX = 0;
// let touchEndY = 0;

// const minSwipeDistance = 30;

// // Touch start
// board.addEventListener("touchstart", (e) => {
//   const touch = e.touches[0];
//   touchStartX = touch.clientX;
//   touchStartY = touch.clientY;
// });

// board.addEventListener("touchmove", (e) => {
//   const touch = e.touches[0];
//   const dx = touch.clientX - touchStartX;
//   const dy = touch.clientY - touchStartY;

//   if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance)
//     return;

//   if (Math.abs(dx) > Math.abs(dy)) {
//     if (dx > 0 && direction !== "left") direction = "right";
//     else if (dx < 0 && direction !== "right") direction = "left";
//   } else {
//     if (dy > 0 && direction !== "up") direction = "down";
//     else if (dy < 0 && direction !== "down") direction = "up";
//   }

//   // reset start to avoid repeated triggers
//   touchStartX = touch.clientX;
//   touchStartY = touch.clientY;
// });
