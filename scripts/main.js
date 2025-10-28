const gameSettings = {
  rows: 30,
  columns: 10,
  mines: 10,
};

let gameState = {};
const defaultGameState = Object.freeze({
  revealedCells: 0,
  flaggedCells: 0,
  startedAt: null,
  endedAt: null,
  timerInterval: null,
});

const difficulties = {
  beginner: {
    rows: 9,
    columns: 9,
    mines: 10,
  },
  intermediate: {
    rows: 16,
    columns: 16,
    mines: 40,
  },
  expert: {
    rows: 24,
    columns: 24,
    mines: 99,
  },
};

const cellListeners = Object.freeze({
  click: handleCellClick,
  contextmenu: handleCellRightClick,
});

const game = document.getElementById("Game");

document.querySelectorAll(".new-game").forEach((button) => {
  button.addEventListener("click", (event) => {
    const difficulty = event.target.dataset.difficulty;

    const difficultyData = difficulties[difficulty] || difficulties.beginner;
    gameSettings.rows = difficultyData.rows;
    gameSettings.columns = difficultyData.columns;
    gameSettings.mines = difficultyData.mines;

    initializeGame();
  });
});

function initializeGame() {
  resetGame();
  fillBoard();
}

function resetGame() {
  // set game state to default
  gameState = { ...defaultGameState };
  updateTimer();
  updateMineCount();
}

function fillBoard() {
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < gameSettings.rows; row++) {
    for (let col = 0; col < gameSettings.columns; col++) {
      const cellElement = createCell(row, col);
      enableCell(cellElement);
      fragment.appendChild(cellElement);
    }
  }
  game.replaceChildren(fragment);
  document.documentElement.style.setProperty("--board-rows", gameSettings.rows);
  document.documentElement.style.setProperty(
    "--board-columns",
    gameSettings.columns,
  );
}

function startGame(startingCell) {
  placeMines(startingCell); // cell is excluded
  startTimer();
}

function startTimer() {
  gameState.startedAt = Date.now();
  gameState.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  let elapsed;
  if (!gameState.startedAt) {
    elapsed = 0;
  } else {
    elapsed = Date.now() - gameState.startedAt;
  }

  document.querySelector(".timer").textContent = formatTime(elapsed);
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = (minutes % 60).toString().padStart(2, "0");
  const formattedSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function endTimer() {
  gameState.endedAt = Date.now();
  clearInterval(gameState.timerInterval);
}

function createCell(row, col) {
  const cellElement = document.createElement("div");
  cellElement.dataset.row = row;
  cellElement.dataset.col = col;
  cellElement.dataset.state = "hidden";
  cellElement.dataset.isFlagged = "false";
  cellElement.classList.add("cell");
  return cellElement;
}

function enableCell(cell) {
  Object.entries(cellListeners).forEach(([type, callback]) => {
    cell.addEventListener(type, callback);
  });
}

function disableCell(cell) {
  Object.entries(cellListeners).forEach(([type, callback]) => {
    cell.removeEventListener(type, callback);
  });
}

function handleCellClick(event) {
  const cell = event.currentTarget;
  // We only generate the mines after first click
  // This avoids player losing immediately
  if (!gameState.startedAt) {
    startGame(cell);
  }
  if (cell.dataset.isFlagged === "true") {
    toggleFlag(cell);
  } else {
    if (cell.dataset.state === "revealed") {
      revealUnflaggedCells(cell);
    } else {
      revealCell(cell);
    }
  }
}

function handleCellRightClick(event) {
  // disable context menu
  event.preventDefault();
  const cell = event.currentTarget;
  if (cell.dataset.state === "revealed") {
    flagNeighbors(cell);
  } else {
    toggleFlag(cell);
  }
}

// Flags all hidden neighbors if they match the number of neighboring mines
function flagNeighbors(cell) {
  const hiddenNeighbors = getNeighbors(getPositionFromCell(cell))
    .map(getCell)
    .filter((cell) => cell.dataset.state === "hidden");

  if (hiddenNeighbors.length == cell.dataset.neighboringMines) {
    hiddenNeighbors.forEach(addFlag);
  }
}

function toggleFlag(cell) {
  if (cell.dataset.state === "revealed") return;
  if (cell.dataset.isFlagged === "true") {
    removeFlag(cell);
  } else {
    addFlag(cell);
  }
}

function addFlag(cell) {
  if (cell.dataset.isFlagged === "true") return;
  cell.dataset.isFlagged = "true";
  gameState.flaggedCells += 1;
  updateMineCount();
}

function removeFlag(cell) {
  if (cell.dataset.isFlagged === "false") return;
  cell.dataset.isFlagged = "false";
  gameState.flaggedCells -= 1;
  updateMineCount();
}

function updateMineCount() {
  document.querySelector(".mine-count").textContent =
    gameSettings.mines - gameState.flaggedCells;
}

// Reveals all surrounding cells that are not flagged only if
// the number of flagged cells match the number of mines
function revealUnflaggedCells(cell) {
  const neighborPositions = getNeighbors(getPositionFromCell(cell));
  const unflaggedNeighbors = neighborPositions
    .map(getCell)
    .filter((cell) => cell.dataset.isFlagged === "false");

  if (
    unflaggedNeighbors.length ==
    neighborPositions.length - cell.dataset.neighboringMines
  ) {
    unflaggedNeighbors.forEach(revealCell);
  }
}

// Reveals a cell and its neighbors if it's empty
function revealCell(cell) {
  if (cell.dataset.state === "revealed") return;
  if (cell.dataset.isMine === "true") {
    gameOver();
    return;
  }

  gameState.revealedCells += 1;

  cell.dataset.state = "revealed";
  // make sure to remove flag from cell when revealed
  removeFlag(cell);

  const neighborPositions = getNeighbors(getPositionFromCell(cell));
  const neighborCells = neighborPositions.map(getCell);
  const neighboringMines = neighborCells.filter(isMine).length;
  cell.dataset.neighboringMines = neighboringMines;
  cell.textContent = neighboringMines;

  if (winCondition()) {
    winGame();
    return;
  }

  if (neighboringMines === 0) {
    neighborCells.forEach(revealCell);
  }
}

function getCell(position) {
  return document.querySelector(
    `[data-row="${position.row}"][data-col="${position.col}"]`,
  );
}

function getPositionFromCell(cell) {
  return {
    row: parseInt(cell.dataset.row),
    col: parseInt(cell.dataset.col),
  };
}

// returns an array of neighboring cell positions
function getNeighbors(cellPosition) {
  const neighbors = [];

  // get all possible surrounding positions
  for (let row = cellPosition.row - 1; row <= cellPosition.row + 1; row++) {
    for (let col = cellPosition.col - 1; col <= cellPosition.col + 1; col++) {
      neighbors.push({ row, col });
    }
  }

  // filter out invalid positions and self
  return neighbors
    .filter(isValidPosition)
    .filter((position) => !isSamePosition(position, cellPosition));
}

// Check if position is within the game board
function isValidPosition(position) {
  return (
    position.row >= 0 &&
    position.row < gameSettings.rows &&
    position.col >= 0 &&
    position.col < gameSettings.columns
  );
}

function isMine(cell) {
  return cell.dataset.isMine === "true";
}

// Check if two positions are equal
function isSamePosition(a, b) {
  return a.row === b.row && a.col === b.col;
}

function placeMines(excludedCell) {
  const mines = generateMinePositions(getPositionFromCell(excludedCell));
  mines.forEach((mine) => {
    const cell = getCell(mine);
    cell.dataset.isMine = "true";
  });
}

function generateMinePositions(excludedPosition) {
  const mines = [];
  while (mines.length < gameSettings.mines) {
    const row = Math.floor(Math.random() * gameSettings.rows);
    const col = Math.floor(Math.random() * gameSettings.columns);
    const position = { row, col };
    if (
      !(
        mines.some((mine) => isSamePosition(mine, position)) ||
        isSamePosition(position, excludedPosition)
      )
    ) {
      mines.push(position);
    }
  }
  return mines;
}

// Check if hidden cells are equal to mines
// this means you win
function winCondition() {
  const hiddenCells = document.querySelectorAll(".cell[data-state='hidden']");
  const mines = document.querySelectorAll(".cell[data-is-mine='true']");
  return hiddenCells.length === mines.length;
}

function winGame() {
  alert("You win!");
  const cells = document.querySelectorAll(".cell");
  cells.forEach(disableCell);
  endTimer();
}

function gameOver() {
  alert("Game Over!");
  const cells = document.querySelectorAll(".cell");
  // for now just reveal all mines
  cells.forEach((cell) => {
    disableCell(cell);
    if (cell.dataset.isMine === "true") {
      cell.dataset.state = "revealed";
    }
  });
  endTimer();
}
