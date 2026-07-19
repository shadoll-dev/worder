(function () {
  const WORD_LENGTH = 5;
  const MAX_GUESSES = 6;
  const LANG_KEY = "worder-lang";
  const SUPPORTED_LANGS = ["en", "uk"];

  let currentLang = "en";
  let answer = "";
  let guessLetters = Array(WORD_LENGTH).fill("");
  let cursor = 0;
  let guesses = [];
  let results = [];
  let gameOver = false;
  let statsRecorded = false;
  let keyStatus = {};
  let ANSWERS = [];
  let VALID_GUESSES = new Set();
  let alphabetSet = new Set();

  const boardEl = document.getElementById("board");
  const messageEl = document.getElementById("message");
  const keyboardEl = document.getElementById("keyboard");
  const helpModal = document.getElementById("help-modal");
  const statsModal = document.getElementById("stats-modal");
  const confirmModal = document.getElementById("confirm-modal");

  const KEY_ROWS_BY_LANG = {
    en: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "back"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["z", "x", "c", "v", "b", "n", "m", "enter"],
    ],
    uk: [
      ["й", "ц", "у", "к", "е", "н", "г", "ш", "щ", "з", "х", "ї", "back"],
      ["ф", "і", "в", "а", "п", "р", "о", "л", "д", "ж", "є"],
      ["я", "ч", "с", "м", "и", "т", "ь", "б", "ю", "ґ", "enter"],
    ],
  };

  let KEY_ROWS = KEY_ROWS_BY_LANG.en;

  function t(key, ...args) {
    const entry = I18N[currentLang][key];
    return typeof entry === "function" ? entry(...args) : entry;
  }

  function storageKey() {
    return `worder-state-${currentLang}`;
  }

  function statsKey() {
    return `worder-stats-${currentLang}`;
  }

  function detectInitialLang() {
    const stored = localStorage.getItem(LANG_KEY);
    if (SUPPORTED_LANGS.includes(stored)) return stored;
    return navigator.language && navigator.language.toLowerCase().startsWith("uk") ? "uk" : "en";
  }

  function pickAnswer() {
    return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
  }

  function buildBoard() {
    boardEl.innerHTML = "";
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = document.createElement("div");
      row.className = "board-row";
      row.id = `row-${r}`;
      for (let c = 0; c < WORD_LENGTH; c++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.id = `tile-${r}-${c}`;
        tile.addEventListener("click", () => selectTile(r, c));
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  function buildKeyboard() {
    keyboardEl.innerHTML = "";
    alphabetSet = new Set(KEY_ROWS.flat().filter((k) => k !== "back" && k !== "enter"));
    KEY_ROWS.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = "keyboard-row";
      row.forEach((key) => {
        const btn = document.createElement("button");
        btn.className = "key" + (key === "enter" || key === "back" ? " wide" : "");
        btn.textContent = key === "back" ? "⌫" : key === "enter" ? "Enter" : key;
        btn.dataset.key = key;
        btn.addEventListener("click", () => handleKey(key));
        rowEl.appendChild(btn);
      });
      keyboardEl.appendChild(rowEl);
    });
  }

  function applyStaticTranslations() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const text = t(el.dataset.i18nTitle);
      el.title = text;
      el.setAttribute("aria-label", text);
    });
    document.getElementById("lang-btn").textContent = t("langSwitchTo");
  }

  function updateWordCount() {
    document.getElementById("word-count").textContent = t(
      "wordCount",
      ANSWERS.length,
      VALID_GUESSES.size
    );
  }

  function setMessage(text, duration) {
    messageEl.textContent = text;
    if (duration) {
      setTimeout(() => {
        if (messageEl.textContent === text) messageEl.textContent = "";
      }, duration);
    }
  }

  function currentRow() {
    return guesses.length;
  }

  function updateRowDisplay() {
    const row = currentRow();
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.getElementById(`tile-${row}-${c}`);
      const letter = guessLetters[c] || "";
      tile.textContent = letter;
      tile.classList.toggle("filled", !!letter);
      tile.classList.toggle("active", !gameOver && c === cursor);
    }
  }

  function selectTile(rowIndex, c) {
    if (gameOver || rowIndex !== currentRow()) return;
    cursor = c;
    updateRowDisplay();
  }

  function shakeRow() {
    const row = document.getElementById(`row-${currentRow()}`);
    row.querySelectorAll(".tile").forEach((t) => {
      t.classList.add("shake");
      setTimeout(() => t.classList.remove("shake"), 500);
    });
  }

  function scoreGuess(guess, answer) {
    const result = Array(WORD_LENGTH).fill("absent");
    const answerLetters = answer.split("");
    const used = Array(WORD_LENGTH).fill(false);

    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === answerLetters[i]) {
        result[i] = "correct";
        used[i] = true;
      }
    }
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (result[i] === "correct") continue;
      const idx = answerLetters.findIndex(
        (l, j) => l === guess[i] && !used[j]
      );
      if (idx !== -1) {
        result[i] = "present";
        used[idx] = true;
      }
    }
    return result;
  }

  function applyResultToRow(rowIndex, guess, result) {
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.getElementById(`tile-${rowIndex}-${c}`);
      setTimeout(() => {
        tile.classList.add("flip");
        tile.classList.add(result[c]);
        tile.textContent = guess[c];
      }, c * 300);
    }
  }

  function updateKeyStatus(guess, result) {
    const priority = { absent: 0, present: 1, correct: 2 };
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = guess[i];
      const status = result[i];
      if (!keyStatus[letter] || priority[status] > priority[keyStatus[letter]]) {
        keyStatus[letter] = status;
      }
    }
    document.querySelectorAll(".key").forEach((btn) => {
      const k = btn.dataset.key;
      if (keyStatus[k]) {
        btn.classList.remove("correct", "present", "absent");
        btn.classList.add(keyStatus[k]);
      }
    });
  }

  function handleKey(key) {
    if (gameOver) return;

    if (key === "enter") {
      submitGuess();
      return;
    }
    if (key === "back") {
      if (guessLetters[cursor]) {
        guessLetters[cursor] = "";
      } else if (cursor > 0) {
        cursor -= 1;
        guessLetters[cursor] = "";
      }
      updateRowDisplay();
      return;
    }
    if (key === "left") {
      cursor = Math.max(0, cursor - 1);
      updateRowDisplay();
      return;
    }
    if (key === "right") {
      cursor = Math.min(WORD_LENGTH - 1, cursor + 1);
      updateRowDisplay();
      return;
    }
    if (alphabetSet.has(key)) {
      guessLetters[cursor] = key;
      const filledCursor = cursor;
      cursor = Math.min(WORD_LENGTH - 1, cursor + 1);
      updateRowDisplay();
      const tile = document.getElementById(`tile-${currentRow()}-${filledCursor}`);
      tile.classList.add("pop");
      setTimeout(() => tile.classList.remove("pop"), 100);
    }
  }

  function submitGuess() {
    const guess = guessLetters.join("");
    if (guess.length < WORD_LENGTH) {
      setMessage(t("notEnoughLetters"), 1500);
      shakeRow();
      return;
    }
    if (!VALID_GUESSES.has(guess)) {
      setMessage(t("notInWordList"), 1500);
      shakeRow();
      return;
    }

    const result = scoreGuess(guess, answer);
    const rowIndex = currentRow();
    applyResultToRow(rowIndex, guess, result);
    updateKeyStatus(guess, result);
    guesses.push(guess);
    results.push(result);

    const won = result.every((r) => r === "correct");
    guessLetters = Array(WORD_LENGTH).fill("");
    cursor = 0;

    setTimeout(() => {
      if (won) {
        gameOver = true;
        bounceRow(rowIndex);
        setMessage(I18N[currentLang].winMessages[rowIndex] || t("youWon"));
        messageEl.classList.add("win-message");
      } else if (guesses.length === MAX_GUESSES) {
        gameOver = true;
        setMessage(t("theWordWas", answer.toUpperCase()));
      }
      if (gameOver && !statsRecorded) {
        recordGameResult(won, guesses.length, answer);
        statsRecorded = true;
      }
      saveState();
    }, WORD_LENGTH * 300 + 200);
  }

  function bounceRow(rowIndex) {
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.getElementById(`tile-${rowIndex}-${c}`);
      setTimeout(() => {
        tile.classList.add("bounce");
        setTimeout(() => tile.classList.remove("bounce"), 600);
      }, c * 100);
    }
  }

  function saveState() {
    localStorage.setItem(
      storageKey(),
      JSON.stringify({ answer, guesses, results, gameOver, keyStatus, statsRecorded })
    );
  }

  function loadState() {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return false;
    try {
      const state = JSON.parse(raw);
      if (!state.answer || Array.from(state.answer).length !== WORD_LENGTH) return false;
      answer = state.answer;
      guesses = state.guesses || [];
      results = state.results || [];
      gameOver = !!state.gameOver;
      keyStatus = state.keyStatus || {};
      statsRecorded = !!state.statsRecorded;
      return true;
    } catch {
      return false;
    }
  }

  function defaultStats() {
    return {
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: [0, 0, 0, 0, 0, 0],
      solvedWords: [],
    };
  }

  function loadStats() {
    const raw = localStorage.getItem(statsKey());
    if (!raw) return defaultStats();
    try {
      const stats = JSON.parse(raw);
      return { ...defaultStats(), ...stats };
    } catch {
      return defaultStats();
    }
  }

  function saveStats(stats) {
    localStorage.setItem(statsKey(), JSON.stringify(stats));
  }

  function recordGameResult(won, guessCount, word) {
    const stats = loadStats();
    stats.played += 1;
    if (won) {
      stats.wins += 1;
      stats.currentStreak += 1;
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
      stats.guessDistribution[guessCount - 1] += 1;
      stats.solvedWords.push(word);
    } else {
      stats.currentStreak = 0;
    }
    saveStats(stats);
  }

  function renderStats() {
    const stats = loadStats();
    const winPct = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;

    const summaryEl = document.getElementById("stats-summary");
    summaryEl.innerHTML = "";
    [
      [t("statPlayed"), stats.played],
      [t("statWinPct"), winPct],
      [t("statStreak"), stats.currentStreak],
      [t("statMaxStreak"), stats.maxStreak],
    ].forEach(([label, value]) => {
      const div = document.createElement("div");
      div.className = "stat";
      div.innerHTML = `<span class="stat-value">${value}</span><span class="stat-label">${label}</span>`;
      summaryEl.appendChild(div);
    });

    const distEl = document.getElementById("stats-distribution");
    distEl.innerHTML = "";
    const maxCount = Math.max(1, ...stats.guessDistribution);
    stats.guessDistribution.forEach((count, i) => {
      const row = document.createElement("div");
      row.className = "dist-row";
      const isLast = guesses.length === i + 1 && gameOver && stats.solvedWords[stats.solvedWords.length - 1] === answer;
      row.innerHTML = `
        <span class="dist-label">${i + 1}</span>
        <span class="dist-bar-wrap">
          <span class="dist-bar${isLast ? " highlight" : ""}" style="width:${(count / maxCount) * 100}%">${count}</span>
        </span>`;
      distEl.appendChild(row);
    });

    const solvedEl = document.getElementById("stats-solved");
    solvedEl.innerHTML = "";
    if (stats.solvedWords.length === 0) {
      solvedEl.innerHTML = `<span class="stats-empty">${t("noWordsSolved")}</span>`;
    } else {
      [...stats.solvedWords].reverse().forEach((word) => {
        const span = document.createElement("span");
        span.className = "solved-word";
        span.textContent = word;
        solvedEl.appendChild(span);
      });
    }
  }

  function replayState() {
    guesses.forEach((guess, rowIndex) => {
      const result = results[rowIndex];
      for (let c = 0; c < WORD_LENGTH; c++) {
        const tile = document.getElementById(`tile-${rowIndex}-${c}`);
        tile.textContent = guess[c];
        tile.classList.add("filled", result[c]);
      }
    });
    document.querySelectorAll(".key").forEach((btn) => {
      const k = btn.dataset.key;
      if (keyStatus[k]) btn.classList.add(keyStatus[k]);
    });
    if (gameOver) {
      const won = results.length && results[results.length - 1].every((r) => r === "correct");
      if (won) {
        setMessage(I18N[currentLang].winMessages[results.length - 1] || t("youWon"));
        messageEl.classList.add("win-message");
      } else if (guesses.length === MAX_GUESSES) {
        setMessage(t("theWordWas", answer.toUpperCase()));
      }
    }
  }

  function newGame() {
    answer = pickAnswer();
    guessLetters = Array(WORD_LENGTH).fill("");
    cursor = 0;
    guesses = [];
    results = [];
    gameOver = false;
    statsRecorded = false;
    keyStatus = {};
    messageEl.textContent = "";
    messageEl.classList.remove("win-message");
    buildBoard();
    buildKeyboard();
    saveState();
  }

  async function loadWords() {
    const res = await fetch(`words.${currentLang}.json`);
    const data = await res.json();
    ANSWERS = data.answers;
    VALID_GUESSES = new Set(data.valid);
    updateWordCount();
  }

  function startOrRestoreGame() {
    buildBoard();
    buildKeyboard();
    if (loadState()) {
      replayState();
    } else {
      newGame();
    }
  }

  async function switchLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    KEY_ROWS = KEY_ROWS_BY_LANG[currentLang];
    applyStaticTranslations();
    setMessage(t("loadingWords"));
    await loadWords();
    messageEl.textContent = "";
    messageEl.classList.remove("win-message");
    startOrRestoreGame();
  }

  async function init() {
    currentLang = detectInitialLang();
    KEY_ROWS = KEY_ROWS_BY_LANG[currentLang];
    applyStaticTranslations();
    setMessage(t("loadingWords"));
    await loadWords();
    messageEl.textContent = "";

    startOrRestoreGame();

    document.addEventListener("keydown", (e) => {
      if (helpModal && !helpModal.classList.contains("hidden")) return;
      if (statsModal && !statsModal.classList.contains("hidden")) return;
      if (confirmModal && !confirmModal.classList.contains("hidden")) return;
      const key = e.key.toLowerCase();
      if (key === "enter") handleKey("enter");
      else if (key === "backspace") handleKey("back");
      else if (key === "arrowleft") handleKey("left");
      else if (key === "arrowright") handleKey("right");
      else if (alphabetSet.has(key)) handleKey(key);
    });

    document.getElementById("lang-btn").addEventListener("click", () => {
      switchLanguage(currentLang === "en" ? "uk" : "en");
    });

    document.getElementById("new-game-btn").addEventListener("click", () => {
      if (gameOver || guesses.length === 0) {
        newGame();
      } else {
        confirmModal.classList.remove("hidden");
      }
    });
    document.getElementById("confirm-ok-btn").addEventListener("click", () => {
      confirmModal.classList.add("hidden");
      newGame();
    });
    document.getElementById("confirm-cancel-btn").addEventListener("click", () => {
      confirmModal.classList.add("hidden");
    });
    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) confirmModal.classList.add("hidden");
    });

    document.getElementById("help-btn").addEventListener("click", () => {
      helpModal.classList.remove("hidden");
    });
    document.getElementById("close-help-btn").addEventListener("click", () => {
      helpModal.classList.add("hidden");
    });
    helpModal.addEventListener("click", (e) => {
      if (e.target === helpModal) helpModal.classList.add("hidden");
    });

    document.getElementById("stats-btn").addEventListener("click", () => {
      renderStats();
      statsModal.classList.remove("hidden");
    });
    document.getElementById("close-stats-btn").addEventListener("click", () => {
      statsModal.classList.add("hidden");
    });
    statsModal.addEventListener("click", (e) => {
      if (e.target === statsModal) statsModal.classList.add("hidden");
    });
  }

  init();
})();
