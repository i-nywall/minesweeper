const gameSettings = {
  rows: 30,
  columns: 10,
  mines: 10,
};

const gameState = {
  revealedCells: 0,
  flaggedCells: 0,
};

const game = document.getElementById("Game");

function fillBoard() {
  const cells = [];
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < gameSettings.rows; row++) {
    for (let col = 0; col < gameSettings.columns; col++) {
      const cellElement = document.createElement("div");
      cellElement.dataset.row = row;
      cellElement.dataset.col = col;
      cellElement.dataset.state = "hidden";
      cellElement.dataset.isFlagged = "false";
      cellElement.classList.add("cell");

      cellElement.addEventListener("click", handleCellClick);
      cellElement.addEventListener("contextmenu", handleCellRightClick);

      cells.push(cellElement);
      fragment.appendChild(cellElement);
    }
  }
  game.appendChild(fragment);
  document.documentElement.style.setProperty("--board-rows", gameSettings.rows);
  document.documentElement.style.setProperty(
    "--board-columns",
    gameSettings.columns,
  );

  return cells;
}

function handleCellClick(event) {
  const cell = event.currentTarget;
  // We only generate the mines after first click
  // This avoids player losing immediately
  if (gameState.revealedCells === 0) {
    placeMines(cell); // cell is excluded
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
}

function removeFlag(cell) {
  if (cell.dataset.isFlagged === "false") return;
  cell.dataset.isFlagged = "false";
  gameState.flaggedCells -= 1;
}

// Reveals all surrounding cells that are not flagged only if
// the number of flagged cells match the number of mines
function revealUnflaggedCells(cell) {
  const unflaggedNeighbors = getNeighbors(getPositionFromCell(cell))
    .map(getCell)
    .filter((cell) => cell.dataset.isFlagged === "false");

  if (unflaggedNeighbors.length == 8 - cell.dataset.neighboringMines) {
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

  if (neighboringMines === 0) {
    neighborCells.forEach(revealCell);
  } else {
    cell.dataset.neighboringMines = neighboringMines;
    cell.textContent = neighboringMines;
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

function gameOver() {
  const cells = document.querySelectorAll(".cell");
  // for now just reveal all mines
  cells.forEach((cell) => {
    if (cell.dataset.isMine === "true") {
      cell.dataset.state = "revealed";
    }
  });
}

function initializeGame() {
  const cells = fillBoard();
}

initializeGame();
