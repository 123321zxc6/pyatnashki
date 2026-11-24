(() => {
  const tg = window.Telegram?.WebApp;
  tg?.ready();
  tg?.expand();

  const boardEl = document.getElementById("board");
  const movesEl = document.getElementById("moves");
  const timeEl = document.getElementById("time");
  const bestEl = document.getElementById("best");
  const messageEl = document.getElementById("message");
  const newGameBtn = document.getElementById("newGame");

  const SIZE = 4;
  const BEST_KEY = "pyatnashki-best-moves";
  let tiles = [];
  let moves = 0;
  let seconds = 0;
  let timer = null;
  let started = false;
  let best = Number(localStorage.getItem(BEST_KEY)) || 0;

  bestEl.textContent = best ? best : "—";

  function isSolved(arr = tiles) {
    return arr.slice(0, 15).every((v, i) => v === i + 1) && arr[15] === 0;
  }

  function neighbors(index) {
    const row = Math.floor(index / SIZE), col = index % SIZE;
    return [
      ...(row > 0 ? [index - SIZE] : []),
      ...(row < SIZE - 1 ? [index + SIZE] : []),
      ...(col > 0 ? [index - 1] : []),
      ...(col < SIZE - 1 ? [index + 1] : [])
    ];
  }

  function formatTime(value) {
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
  }

  function updateStats() {
    movesEl.textContent = moves;
    timeEl.textContent = formatTime(seconds);
    bestEl.textContent = best || "—";
  }

  function render() {
    boardEl.innerHTML = "";
    tiles.forEach((value, index) => {
      const button = document.createElement("button");
      button.className = "tile" + (value === 0 ? " empty" : "");
      if (value && value === index + 1) button.classList.add("correct");
      button.type = "button";
      button.textContent = value || "";
      button.setAttribute("aria-label", value ? `Плитка ${value}` : "Пустая клетка");
      button.disabled = value === 0;
      button.addEventListener("click", () => move(index));
      boardEl.appendChild(button);
    });
  }

  function startTimer() {
    if (timer || !started) return;
    timer = setInterval(() => {
      seconds++;
      timeEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
  }

  function move(index) {
    const empty = tiles.indexOf(0);
    if (!neighbors(empty).includes(index) || isSolved()) return;
    [tiles[empty], tiles[index]] = [tiles[index], tiles[empty]];
    moves++;
    started = true;
    startTimer();
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
    updateStats();
    render();
    if (isSolved()) win();
  }

  function win() {
    stopTimer();
    messageEl.textContent = `Собрано! Время: ${formatTime(seconds)}, ходов: ${moves}`;
    messageEl.classList.add("win");
    if (!best || moves < best) {
      best = moves;
      localStorage.setItem(BEST_KEY, String(best));
      updateStats();
    }
    tg?.HapticFeedback?.notificationOccurred("success");
  }

  function shuffle() {
    // Перемешиваем только легальными ходами — поле всегда остаётся решаемым.
    let previousEmpty = -1;
    for (let i = 0; i < 240; i++) {
      const empty = tiles.indexOf(0);
      let options = neighbors(empty).filter(n => n !== previousEmpty);
      if (!options.length) options = neighbors(empty);
      const chosen = options[Math.floor(Math.random() * options.length)];
      [tiles[empty], tiles[chosen]] = [tiles[chosen], tiles[empty]];
      previousEmpty = empty;
    }
    if (isSolved()) shuffle();
  }

  function newGame() {
    stopTimer();
    tiles = Array.from({ length: 15 }, (_, i) => i + 1).concat(0);
    shuffle();
    moves = 0;
    seconds = 0;
    started = false;
    messageEl.textContent = "Сдвигай плитки в пустую клетку";
    messageEl.classList.remove("win");
    updateStats();
    render();
  }

  document.addEventListener("keydown", event => {
    const empty = tiles.indexOf(0);
    const row = Math.floor(empty / SIZE), col = empty % SIZE;
    let target = -1;
    if (event.key === "ArrowUp" && row < SIZE - 1) target = empty + SIZE;
    if (event.key === "ArrowDown" && row > 0) target = empty - SIZE;
    if (event.key === "ArrowLeft" && col < SIZE - 1) target = empty + 1;
    if (event.key === "ArrowRight" && col > 0) target = empty - 1;
    if (target >= 0) { event.preventDefault(); move(target); }
  });

  newGameBtn.addEventListener("click", newGame);
  newGame();
})();
