const WIN_LINES = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    const PLAYERS = { X: 'X', O: 'O' };
    const MODES = { SINGLE: 'single', MULTI: 'multi' };
    const DIFFICULTIES = { EASY: 'easy', NORMAL: 'normal', HARD: 'hard' };

    const state = {
      board: Array(9).fill(null),
      currentPlayer: PLAYERS.X,
      isGameOver: false,
      mode: MODES.SINGLE,
      difficulty: DIFFICULTIES.NORMAL,
      scores: { X: 0, O: 0 },
      aiTimerId: null,
      autoResetTimerId: null
    };

    const ui = {
      wrap: document.querySelector('.ttt-wrap'),
      board: document.getElementById('board'),
      status: document.getElementById('status'),
      cells: Array.from(document.querySelectorAll('.ttt-cell')),
      marks: Array.from(document.querySelectorAll('.mark')),
      singleModeButton: document.getElementById('singleBtn'),
      multiModeButton: document.getElementById('multiBtn'),
      difficultyWrap: document.getElementById('difficultyWrap'),
      difficultyButtons: Array.from(document.querySelectorAll('.difficulty-btn')),
      labelX: document.getElementById('labelX'),
      labelO: document.getElementById('labelO'),
      scoreX: document.getElementById('sx'),
      scoreO: document.getElementById('so'),
      newRoundButton: document.getElementById('newRoundBtn'),
      resetScoresButton: document.getElementById('resetScoresBtn')
    };

    function initializeGame() {
      bindEvents();
      updateModeUI();
      updateDifficultyUI();
      updateScoreLabels();
      startNextRound();
    }

    function bindEvents() {
      ui.singleModeButton.addEventListener('click', () => setMode(MODES.SINGLE));
      ui.multiModeButton.addEventListener('click', () => setMode(MODES.MULTI));
      ui.newRoundButton.addEventListener('click', startNextRound);
      ui.resetScoresButton.addEventListener('click', resetAllScores);

      ui.difficultyButtons.forEach((button) => {
        button.addEventListener('click', () => setDifficulty(button.dataset.diff));
      });

      ui.cells.forEach((cell, index) => {
        cell.addEventListener('click', () => playMove(index));
      });
    }

    function setMode(nextMode) {
      if (state.mode === nextMode) return;
      state.mode = nextMode;
      updateModeUI();
      updateDifficultyUI();
      updateScoreLabels();
      resetAllScores();
    }

    function setDifficulty(nextDifficulty) {
      if (!Object.values(DIFFICULTIES).includes(nextDifficulty)) return;
      if (state.difficulty === nextDifficulty) return;
      state.difficulty = nextDifficulty;
      updateDifficultyUI();
      if (state.mode === MODES.SINGLE) startNextRound();
    }

    function updateModeUI() {
      ui.singleModeButton.classList.toggle('active', state.mode === MODES.SINGLE);
      ui.multiModeButton.classList.toggle('active', state.mode === MODES.MULTI);
      ui.difficultyWrap.classList.toggle('hidden', state.mode !== MODES.SINGLE);
    }

    function updateDifficultyUI() {
      ui.difficultyButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.diff === state.difficulty);
      });
    }

    function updateScoreLabels() {
      if (state.mode === MODES.SINGLE) {
        ui.labelX.textContent = 'You (X)';
        ui.labelO.textContent = 'CPU (O)';
      } else {
        ui.labelX.textContent = 'Player X';
        ui.labelO.textContent = 'Player O';
      }
    }

    function setWrapState(className) {
      ui.wrap.classList.remove('turn-x', 'turn-o', 'win-x', 'win-o', 'draw');
      if (className) ui.wrap.classList.add(className);
    }

    function animateStatusPulse() {
      ui.status.classList.remove('pulse');
      void ui.status.offsetWidth;
      ui.status.classList.add('pulse');
    }

    function animateBoardEntry() {
      ui.board.classList.remove('board-enter');
      void ui.board.offsetWidth;
      ui.board.classList.add('board-enter');
    }

    function animateScoreBump(player) {
      const scoreElement = player === PLAYERS.X ? ui.scoreX : ui.scoreO;
      scoreElement.classList.remove('bump');
      void scoreElement.offsetWidth;
      scoreElement.classList.add('bump');
    }

    function clearAiTimer() {
      if (state.aiTimerId !== null) {
        clearTimeout(state.aiTimerId);
        state.aiTimerId = null;
      }
      ui.board.classList.remove('ai-thinking');
    }

    function clearAutoResetTimer() {
      if (state.autoResetTimerId !== null) {
        clearTimeout(state.autoResetTimerId);
        state.autoResetTimerId = null;
      }
    }

    function scheduleAutoRoundReset() {
      clearAutoResetTimer();
      state.autoResetTimerId = setTimeout(() => {
        state.autoResetTimerId = null;
        startNextRound();
      }, 1500);
    }

    function renderMove(index, player) {
      const cell = ui.cells[index];
      const mark = ui.marks[index];
      mark.textContent = player;
      cell.classList.add('taken', player === PLAYERS.X ? 'x-cell' : 'o-cell');
      cell.classList.remove('hit');
      void cell.offsetWidth;
      cell.classList.add('hit');
      requestAnimationFrame(() => mark.classList.add('show'));
    }

    function playMove(index, fromAi = false) {
      if (state.isGameOver || state.board[index]) return;
      if (state.mode === MODES.SINGLE && state.currentPlayer === PLAYERS.O && !fromAi) return;

      state.board[index] = state.currentPlayer;
      renderMove(index, state.currentPlayer);

      const winningLine = findWinningLine(state.board);
      if (winningLine) {
        finishWithWinner(winningLine);
        return;
      }

      if (state.board.every(Boolean)) {
        finishWithDraw();
        return;
      }

      state.currentPlayer = state.currentPlayer === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
      updateStatus();

      if (state.mode === MODES.SINGLE && state.currentPlayer === PLAYERS.O) {
        queueComputerMove();
      }
    }

    function finishWithWinner(winningLine) {
      state.isGameOver = true;
      clearAiTimer();

      const winner = state.currentPlayer;
      state.scores[winner] += 1;
      ui.scoreX.textContent = state.scores.X;
      ui.scoreO.textContent = state.scores.O;
      animateScoreBump(winner);

      ui.status.textContent = state.mode === MODES.SINGLE
        ? (winner === PLAYERS.X ? 'You win! 🎉' : 'Computer wins! 🤖')
        : `${winner} wins! 🎉`;
      ui.status.className = 'ttt-status win';
      setWrapState(winner === PLAYERS.X ? 'win-x' : 'win-o');
      animateStatusPulse();

      winningLine.forEach((index) => {
        ui.cells[index].classList.add('winner-cell');
      });

      scheduleAutoRoundReset();
    }

    function finishWithDraw() {
      state.isGameOver = true;
      clearAiTimer();
      ui.status.textContent = "It's a draw!";
      ui.status.className = 'ttt-status draw';
      setWrapState('draw');
      animateStatusPulse();
      scheduleAutoRoundReset();
    }

    function findWinningLine(cells) {
      for (const [a, b, c] of WIN_LINES) {
        if (cells[a] && cells[a] === cells[b] && cells[b] === cells[c]) {
          return [a, b, c];
        }
      }
      return null;
    }

    function getAvailableMoves(cells = state.board) {
      const moves = [];
      for (let i = 0; i < cells.length; i += 1) {
        if (!cells[i]) moves.push(i);
      }
      return moves;
    }

    function getRandomMove(moves) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    function findImmediateWinningMove(player) {
      const moves = getAvailableMoves();
      for (const move of moves) {
        state.board[move] = player;
        const isWinningMove = Boolean(findWinningLine(state.board));
        state.board[move] = null;
        if (isWinningMove) return move;
      }
      return -1;
    }

    function getHeuristicMove() {
      if (!state.board[4]) return 4;

      const openCorners = [0, 2, 6, 8].filter((index) => !state.board[index]);
      if (openCorners.length) return getRandomMove(openCorners);

      const openSides = [1, 3, 5, 7].filter((index) => !state.board[index]);
      if (openSides.length) return getRandomMove(openSides);

      const moves = getAvailableMoves();
      return moves.length ? moves[0] : -1;
    }

    function getBoardResult(cells) {
      const winningLine = findWinningLine(cells);
      if (winningLine) return cells[winningLine[0]];
      if (cells.every(Boolean)) return 'draw';
      return null;
    }

    function minimax(cells, maximizing, depth) {
      const result = getBoardResult(cells);
      if (result !== null) {
        if (result === PLAYERS.O) return 10 - depth;
        if (result === PLAYERS.X) return depth - 10;
        return 0;
      }

      if (maximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < cells.length; i += 1) {
          if (cells[i]) continue;
          cells[i] = PLAYERS.O;
          const score = minimax(cells, false, depth + 1);
          cells[i] = null;
          if (score > bestScore) bestScore = score;
        }
        return bestScore;
      }

      let bestScore = Infinity;
      for (let i = 0; i < cells.length; i += 1) {
        if (cells[i]) continue;
        cells[i] = PLAYERS.X;
        const score = minimax(cells, true, depth + 1);
        cells[i] = null;
        if (score < bestScore) bestScore = score;
      }
      return bestScore;
    }

    function getScoredComputerMoves() {
      const scoredMoves = [];
      const moves = getAvailableMoves();

      for (const move of moves) {
        state.board[move] = PLAYERS.O;
        const score = minimax(state.board, false, 0);
        state.board[move] = null;
        scoredMoves.push({ move, score });
      }

      scoredMoves.sort((a, b) => b.score - a.score);
      return scoredMoves;
    }

    function chooseComputerMove() {
      const moves = getAvailableMoves();
      if (!moves.length) return -1;

      if (state.difficulty === DIFFICULTIES.EASY) {
        return getRandomMove(moves);
      }

      const winningMove = findImmediateWinningMove(PLAYERS.O);
      if (winningMove >= 0) return winningMove;

      const blockingMove = findImmediateWinningMove(PLAYERS.X);
      if (blockingMove >= 0) return blockingMove;

      if (state.difficulty === DIFFICULTIES.NORMAL) {
        if (Math.random() < 0.52) return getRandomMove(moves);
        return getHeuristicMove();
      }

      const scoredMoves = getScoredComputerMoves();
      if (!scoredMoves.length) return -1;

      if (scoredMoves.length === 1) return scoredMoves[0].move;
      if (Math.random() < 0.76) return scoredMoves[0].move;

      const nearTopMoves = scoredMoves
        .filter((entry) => entry.score >= scoredMoves[0].score - 2)
        .map((entry) => entry.move);

      return getRandomMove(nearTopMoves);
    }

    function getComputerThinkingDelay() {
      if (state.difficulty === DIFFICULTIES.EASY) return 300;
      if (state.difficulty === DIFFICULTIES.NORMAL) return 500;
      return 680;
    }

    function queueComputerMove() {
      clearAiTimer();
      ui.board.classList.add('ai-thinking');

      if (state.difficulty === DIFFICULTIES.EASY) {
        ui.status.textContent = 'Computer is guessing...';
      } else if (state.difficulty === DIFFICULTIES.NORMAL) {
        ui.status.textContent = 'Computer is thinking...';
      } else {
        ui.status.textContent = 'Computer is planning ahead...';
      }

      ui.status.className = 'ttt-status turn-o';
      setWrapState('turn-o');
      animateStatusPulse();

      state.aiTimerId = setTimeout(() => {
        state.aiTimerId = null;
        ui.board.classList.remove('ai-thinking');
        if (state.isGameOver || state.mode !== MODES.SINGLE || state.currentPlayer !== PLAYERS.O) return;
        const move = chooseComputerMove();
        if (move >= 0) playMove(move, true);
      }, getComputerThinkingDelay());
    }

    function updateStatus() {
      if (state.mode === MODES.SINGLE) {
        ui.status.textContent = state.currentPlayer === PLAYERS.X ? 'Your turn (X)' : "Computer's turn (O)";
      } else {
        ui.status.textContent = `${state.currentPlayer}'s turn`;
      }

      ui.status.className = `ttt-status ${state.currentPlayer === PLAYERS.X ? 'turn-x' : 'turn-o'}`;
      setWrapState(state.currentPlayer === PLAYERS.X ? 'turn-x' : 'turn-o');
      animateStatusPulse();
    }

    function getRandomStarter() {
      return Math.random() < 0.5 ? PLAYERS.X : PLAYERS.O;
    }

    function resetBoardUi() {
      ui.cells.forEach((cell) => {
        cell.className = 'ttt-cell';
      });
      ui.marks.forEach((mark) => {
        mark.textContent = '';
        mark.classList.remove('show');
      });
    }

    function startNextRound() {
      clearAiTimer();
      clearAutoResetTimer();
      state.board = Array(9).fill(null);
      state.currentPlayer = getRandomStarter();
      state.isGameOver = false;
      resetBoardUi();
      updateStatus();
      animateBoardEntry();

      if (state.mode === MODES.SINGLE && state.currentPlayer === PLAYERS.O) {
        queueComputerMove();
      }
    }

    function resetAllScores() {
      clearAiTimer();
      clearAutoResetTimer();
      state.scores = { X: 0, O: 0 };
      ui.scoreX.textContent = '0';
      ui.scoreO.textContent = '0';
      startNextRound();
    }

    initializeGame();
