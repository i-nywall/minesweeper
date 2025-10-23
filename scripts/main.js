const gameSettings = {
  rows: 10,
  columns: 10,
  mines: 10,
};

const game = document.getElementById("Game");

function fillBoard() {
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < gameSettings.rows; row++) {
    for (let col = 0; col < gameSettings.columns; col++) {
      const cellElement = document.createElement("div");
      cellElement.classList.add("cell");
      fragment.appendChild(cellElement);
    }
  }

  game.appendChild(fragment);
}

fillBoard();
