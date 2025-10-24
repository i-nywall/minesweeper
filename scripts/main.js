const gameSettings = {
  rows: 30,
  columns: 10,
  mines: 10,
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
      cellElement.dataset.flagged = "false";
      cellElement.classList.add("cell");

      cellElement.addEventListener("click", () => {
        revealCell(cellElement);
      });

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

// Reveals a cell and its neighbors if it's empty
function revealCell(cell) {
  if (cell.dataset.state === "revealed") return;

  cell.dataset.state = "revealed";
  const neighborPositions = getNeighbors(getPositionFromCell(cell));
  const neighborCells = neighborPositions.map(getCell);
  const neighboringBombs = neighborCells.filter(isBomb).length;

  if (neighboringBombs === 0) {
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

function isBomb(cell) {
  return cell.dataset.bomb === "true";
}

// Check if two positions are equal
function isSamePosition(a, b) {
  return a.row === b.row && a.col === b.col;
}

function initializeGame() {
  const cells = fillBoard();
}

initializeGame();
