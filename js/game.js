(() => {
  // ── State ──────────────────────────────────────────────────────────────────
  const STATE = { MENU: 0, SERVE: 1, PLAYING: 2, POINT_END: 3, GAME_OVER: 4 };

  let state      = STATE.MENU;
  let gameMode   = null;   // 'continuous' | 'single' | 'set'

  let playerScore = 0;
  let cpuScore    = 0;
  let playerGames = 0;
  let cpuGames    = 0;

  // Continuous mode state
  let lives          = C.LIVES;
  let continuousScore = 0;
  let highScore       = 0;

  let servingSide  = 'player';
  let pointEndMsg  = '';
  let lastTouchLabel = '';
  let lastTouchTimer = 0;
  let cpuServeTimer  = 0;
  let frame          = 0;
  let lastXFrame     = -999;

  const ball   = new Ball();
  const player = new Player();
  let   cpu    = new CPU('medium');

  // ── Continuous difficulty ramp ─────────────────────────────────────────────
  function getContinuousProfile(score) {
    const t = Math.min(1, score / 25);
    return {
      speed:         4.0 + t * 1.8,
      reactionDelay: Math.round(9 * (1 - t)),
      aimSpread:     Math.round(18 - t * 14),
      shootSpeed:    7.0 + t * 2.0
    };
  }

  function updateContinuousProfile() {
    if (gameMode === 'continuous') cpu.profile = getContinuousProfile(continuousScore);
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  const keys = {};

  document.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
    if (!keys[e.key]) {
      keys[e.key] = true;
      handleKeyPress(e.key);
    }
  });

  document.addEventListener('keyup', e => { keys[e.key] = false; });

  // Mode button clicks on menu
  const canvas = document.getElementById('gameCanvas');
  canvas.addEventListener('click', e => {
    if (state !== STATE.MENU) return;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = C.CANVAS_W / rect.width;
    const scaleY = C.CANVAS_H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;

    const modes = ['continuous', 'single', 'set'];
    modes.forEach((m, i) => {
      const bx = C.CANVAS_W / 2 - 200 + i * 140;
      const by = 300;
      if (mx >= bx && mx <= bx + 120 && my >= by && my <= by + 50) {
        startGame(m);
      }
    });
  });

  function handleKeyPress(key) {
    // ESC always exits to menu
    if (key === 'Escape' && state !== STATE.MENU) {
      state = STATE.MENU;
      return;
    }

    if (state === STATE.GAME_OVER && key === 'Enter') {
      state = STATE.MENU;
      return;
    }

    if (key === 'x') {
      const isSpike = (frame - lastXFrame) <= C.DOUBLE_TAP_FRAMES;
      lastXFrame = frame;

      if (state === STATE.SERVE && servingSide === 'player') {
        const { aimX, aimY } = player.getAim();
        const speed = isSpike ? C.SPIKE_SPEED : C.SHOOT_SPEED;
        const vz    = isSpike ? C.SPIKE_VZ    : C.SHOOT_VZ;
        if (player.shootTouch(ball, aimX, aimY, speed, vz)) {
          state = STATE.PLAYING;
          showTouchLabel(isSpike ? 'SPIKE!' : 'SHOOT!');
        }
        return;
      }

      if (state === STATE.PLAYING && ball.side === 'player') {
        const { aimX, aimY } = player.getAim();
        const speed = isSpike ? C.SPIKE_SPEED : C.SHOOT_SPEED;
        const vz    = isSpike ? C.SPIKE_VZ    : C.SHOOT_VZ;
        if (player.shootTouch(ball, aimX, aimY, speed, vz)) {
          showTouchLabel(isSpike ? 'SPIKE!' : 'SHOOT!');
        }
      }
      return;
    }

    if (state !== STATE.PLAYING) return;

    if (key === 'z' && ball.side === 'player') {
      if (player.settleTouch(ball)) showTouchLabel('SETTLE');
    }
  }

  function showTouchLabel(label) {
    lastTouchLabel = label;
    lastTouchTimer = 28;
  }

  // ── Game control ───────────────────────────────────────────────────────────
  function startGame(mode) {
    gameMode    = mode;
    playerScore = 0;
    cpuScore    = 0;
    playerGames = 0;
    cpuGames    = 0;
    servingSide = 'player';
    cpu = new CPU('medium');

    if (mode === 'continuous') {
      lives           = C.LIVES;
      continuousScore = 0;
      updateContinuousProfile();
    }

    startServe();
  }

  function startServe() {
    ball.reset(servingSide);
    player.resetPosition();
    player.resetTouch();
    cpu.resetPosition();
    cpu.resetTouch();
    lastTouchLabel = '';
    lastTouchTimer = 0;
    cpuServeTimer  = servingSide === 'cpu' ? 90 : 0;
    state = STATE.SERVE;
  }

  function wonSet(g, opp) {
    return g >= C.WIN_GAMES && g - opp >= 2;
  }

  function awardPoint(loser) {
    Audio.point();

    // ── Continuous mode ──────────────────────────────────────────────────────
    if (gameMode === 'continuous') {
      if (loser === 'player') {
        lives--;
        if (lives <= 0) {
          if (continuousScore > highScore) highScore = continuousScore;
          pointEndMsg = `GAME OVER — SCORE: ${continuousScore}`;
          state = STATE.POINT_END;
          setTimeout(() => { state = STATE.GAME_OVER; Audio.lose(); }, C.POINT_END_DELAY);
        } else {
          pointEndMsg = `OUT! ${lives} ${lives === 1 ? 'LIFE' : 'LIVES'} LEFT`;
          state = STATE.POINT_END;
          servingSide = 'cpu';
          setTimeout(() => startServe(), C.POINT_END_DELAY);
        }
      } else {
        continuousScore++;
        updateContinuousProfile();
        pointEndMsg = `POINT! SCORE: ${continuousScore}`;
        state = STATE.POINT_END;
        servingSide = 'player';
        setTimeout(() => startServe(), C.POINT_END_DELAY);
      }
      return;
    }

    // ── Single / Set modes ───────────────────────────────────────────────────
    if (loser === 'player') { cpuScore++;    pointEndMsg = 'CPU SCORES!'; }
    else                    { playerScore++; pointEndMsg = 'YOU SCORE!'; }

    state = STATE.POINT_END;

    const playerWonGame = playerScore >= C.WIN_SCORE;
    const cpuWonGame    = cpuScore    >= C.WIN_SCORE;

    if (playerWonGame || cpuWonGame) {
      if (playerWonGame) { playerGames++; pointEndMsg = 'GAME — YOU WIN!'; }
      else               { cpuGames++;    pointEndMsg = 'GAME — CPU WINS!'; }
      Audio.point();

      // Single game: one game = match over
      if (gameMode === 'single') {
        setTimeout(() => {
          state = STATE.GAME_OVER;
          playerWonGame ? Audio.win() : Audio.lose();
        }, C.POINT_END_DELAY);
        return;
      }

      // Set: check if set is decided
      if (wonSet(playerGames, cpuGames) || wonSet(cpuGames, playerGames)) {
        setTimeout(() => {
          state = STATE.GAME_OVER;
          wonSet(playerGames, cpuGames) ? Audio.win() : Audio.lose();
        }, C.POINT_END_DELAY);
        return;
      }

      // Next game in set
      playerScore = 0;
      cpuScore    = 0;
      servingSide = playerWonGame ? 'player' : 'cpu';
      setTimeout(() => startServe(), C.POINT_END_DELAY);
      return;
    }

    // Normal point — loser serves next
    servingSide = loser === 'player' ? 'cpu' : 'player';
    setTimeout(() => startServe(), C.POINT_END_DELAY);
  }

  // ── Main loop ──────────────────────────────────────────────────────────────
  function update() {
    if (state === STATE.MENU || state === STATE.GAME_OVER || state === STATE.POINT_END) return;

    // CPU auto-serve
    if (state === STATE.SERVE && servingSide === 'cpu') {
      if (--cpuServeTimer <= 0) {
        const aimX = C.CANVAS_W * 0.25 + (Math.random() - 0.5) * 80;
        const aimY = C.CANVAS_H / 2   + (Math.random() - 0.5) * 80;
        cpu.shootTouch(ball, aimX, aimY, C.CPU_SERVE_SPEED, C.SHOOT_VZ * 0.75);
        state = STATE.PLAYING;
      }
      return;
    }

    frame++;
    player.update(keys);
    player.updateAnim();
    cpu.updateAnim();

    if (state !== STATE.PLAYING) return;

    const prevSide = ball.side;
    cpu.update(ball);
    const fault = ball.update();

    if (ball.side !== prevSide && ball.side === 'cpu') {
      cpu.onBallEntersHalf();
      cpu.resetTouch();
    }
    if (ball.side !== prevSide && ball.side === 'player') {
      player.resetTouch();
    }

    if (fault) awardPoint(fault.loser);

    if (lastTouchTimer > 0) lastTouchTimer--;
  }

  function render() {
    Renderer.clear();

    if (state === STATE.MENU) {
      Renderer.drawMenu(gameMode, highScore);
      return;
    }

    Renderer.drawCourt();
    Renderer.drawEntity(player, 'player');
    Renderer.drawEntity(cpu, 'cpu');
    Renderer.drawBall(ball);

    if (gameMode === 'continuous') {
      Renderer.drawHUDContinuous(continuousScore, highScore, lives);
    } else {
      Renderer.drawHUD(playerScore, cpuScore, playerGames, cpuGames,
                       player.touchCount, gameMode);
    }

    if (lastTouchTimer > 0) Renderer.drawTouchFeedback(player, lastTouchLabel);

    if (state === STATE.SERVE)      Renderer.drawServePrompt(servingSide === 'player');
    if (state === STATE.POINT_END)  Renderer.drawPointEnd(pointEndMsg);

    if (state === STATE.GAME_OVER) {
      if (gameMode === 'continuous') {
        Renderer.drawGameOverContinuous(continuousScore, highScore);
      } else {
        Renderer.drawGameOver(
          gameMode === 'set' ? wonSet(playerGames, cpuGames) : playerGames > 0,
          playerGames, cpuGames, gameMode
        );
      }
    }
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');

    function resize() {
      const maxW  = window.innerWidth  - 20;
      const maxH  = window.innerHeight - 20;
      const scale = Math.min(maxW / C.CANVAS_W, maxH / C.CANVAS_H);
      canvas.style.width  = Math.floor(C.CANVAS_W * scale) + 'px';
      canvas.style.height = Math.floor(C.CANVAS_H * scale) + 'px';
    }
    window.addEventListener('resize', resize);
    resize();

    Renderer.init(canvas);
    loop();
  });
})();
