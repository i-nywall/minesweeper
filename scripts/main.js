const gameSettings = {
  rows: 30,
  columns: 10,
  mines: 10,
};

const game = document.getElementById("Game");

function fillBoard() {
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < gameSettings.rows; row++) {
    for (let col = 0; col < gameSettings.columns; col++) {
      const cellElement = document.createElement("div");
      cellElement.dataset.row = row;
      cellElement.dataset.col = col;
      cellElement.dataset.state = "hidden";
      cellElement.dataset.flagged = "false";
      cellElement.classList.add("cell");
      fragment.appendChild(cellElement);
    }
  }

  game.appendChild(fragment);
  document.documentElement.style.setProperty("--board-rows", gameSettings.rows);
  document.documentElement.style.setProperty(
    "--board-columns",
    gameSettings.columns,
  );
}

fillBoard();
