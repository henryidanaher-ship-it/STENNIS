const Renderer = (() => {
  const COURT_COLOR  = '#2e7d32';
  const LINE_COLOR   = 'rgba(255,255,255,0.75)';
  const NET_COLOR    = '#e8e8a0';
  const SHADOW_COLOR = 'rgba(0,0,0,0.35)';
  const HUD_BG       = 'rgba(0,40,10,0.78)';
  const PLAYER_COLOR = '#7dff9a';
  const CPU_COLOR    = '#ff7070';

  let canvas, ctx;

  function init(c) {
    canvas = c;
    ctx = canvas.getContext('2d');
    canvas.width  = C.CANVAS_W;
    canvas.height = C.CANVAS_H;
  }

  function clear() {
    ctx.clearRect(0, 0, C.CANVAS_W, C.CANVAS_H);
  }

  function drawCourt() {
    const p = C.COURT_PAD;

    // Grass
    ctx.fillStyle = COURT_COLOR;
    ctx.fillRect(p, p, C.CANVAS_W - p * 2, C.CANVAS_H - p * 2);

    // Outer boundary
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(p, p, C.CANVAS_W - p * 2, C.CANVAS_H - p * 2);

    // Service boxes — light lines at 1/4 and 3/4 of each half
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    const halfW  = (C.CANVAS_W - p * 2) / 2;
    const svcOff = halfW * 0.45;
    // Player side service line
    ctx.beginPath();
    ctx.moveTo(p + svcOff, p);
    ctx.lineTo(p + svcOff, C.CANVAS_H - p);
    ctx.stroke();
    // CPU side service line
    ctx.beginPath();
    ctx.moveTo(C.CANVAS_W - p - svcOff, p);
    ctx.lineTo(C.CANVAS_W - p - svcOff, C.CANVAS_H - p);
    ctx.stroke();
    // Center T line (horizontal midpoint of each service box)
    const midY = C.CANVAS_H / 2;
    ctx.beginPath();
    ctx.moveTo(p + svcOff, midY);
    ctx.lineTo(C.CANVAS_W - p - svcOff, midY);
    ctx.stroke();

    // Center dashed line (behind net, decorative)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(C.CANVAS_W / 2, p);
    ctx.lineTo(C.CANVAS_W / 2, C.CANVAS_H - p);
    ctx.stroke();
    ctx.setLineDash([]);

    // Net
    ctx.fillStyle = NET_COLOR;
    ctx.fillRect(
      C.CANVAS_W / 2 - C.NET_THICKNESS / 2, p,
      C.NET_THICKNESS, C.CANVAS_H - p * 2
    );

    // Net posts
    ctx.fillStyle = '#b8b860';
    ctx.fillRect(C.CANVAS_W / 2 - C.NET_THICKNESS / 2 - 2, p - 4, C.NET_THICKNESS + 4, 8);
    ctx.fillRect(C.CANVAS_W / 2 - C.NET_THICKNESS / 2 - 2, C.CANVAS_H - p - 4, C.NET_THICKNESS + 4, 8);
  }

  function drawEntity(e, side) {
    const cx   = Math.round(e.x);
    const cy   = Math.round(e.y);
    const anim = e.animState;

    const dir       = side === 'player' ? 1 : -1;
    const kickExtra = anim === 'kick'   ? 10 * dir : 0;
    const headShift = anim === 'header' ? 7  * dir : 0;
    const headRise  = anim === 'header' ? 3         : 0;

    const headCX    = cx + headShift;
    const headCY    = cy - 16 - headRise;
    const headR     = anim === 'header' ? 10 : 9;
    const bodyTop   = cy - 7;
    const bodyBot   = cy + 10;
    const shortsBot = cy + 18;
    const sockTop   = cy + 18;
    const legBot    = cy + 25;

    if (side === 'player') {
      // ── Brazil ──────────────────────────────────────────────────────────────

      ctx.fillStyle = '#FFDF00';
      ctx.fillRect(cx - 20, bodyTop, 6, 9);
      ctx.fillRect(cx + 14, bodyTop, 6, 9);

      ctx.fillStyle = '#FFDF00';
      ctx.fillRect(cx - 14, bodyTop, 28, bodyBot - bodyTop);

      ctx.fillStyle = '#009C3B';
      ctx.fillRect(cx - 4, bodyTop,     8, 3);
      ctx.fillRect(cx - 2, bodyTop + 3, 4, 2);

      ctx.fillStyle = '#003087';
      ctx.fillRect(cx - 13, bodyBot, 26, shortsBot - bodyBot);

      // Left (trailing) leg
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 13, sockTop, 10, legBot - sockTop - 3);
      ctx.fillStyle = '#009C3B';
      ctx.fillRect(cx - 13, sockTop, 10, 3);
      ctx.fillStyle = '#111';
      ctx.fillRect(cx - 14, legBot - 3, 12, 3);

      // Right (leading / kick) leg
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx + 3 + kickExtra, sockTop, 10, legBot - sockTop - 3);
      ctx.fillStyle = '#009C3B';
      ctx.fillRect(cx + 3 + kickExtra, sockTop, 10, 3);
      ctx.fillStyle = '#111';
      ctx.fillRect(cx + 2 + kickExtra, legBot - 3, 12, 3);

      ctx.fillStyle = '#D4956A';
      ctx.beginPath();
      ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3D1C02';
      ctx.beginPath();
      ctx.arc(headCX, headCY, headR, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.fillRect(headCX - 4, headCY + 1, 3, 2);
      ctx.fillRect(headCX + 1, headCY + 1, 3, 2);

    } else {
      // ── Argentina ───────────────────────────────────────────────────────────

      ctx.fillStyle = '#74ACDF';
      ctx.fillRect(cx - 20, bodyTop, 6, 9);
      ctx.fillRect(cx + 14, bodyTop, 6, 9);

      for (let s = 0; s < 28; s += 5) {
        ctx.fillStyle = (Math.floor(s / 5) % 2 === 0) ? '#74ACDF' : '#FFFFFF';
        ctx.fillRect(cx - 14 + s, bodyTop, Math.min(5, 28 - s), bodyBot - bodyTop);
      }

      ctx.fillStyle = '#74ACDF';
      ctx.fillRect(cx - 5, bodyTop, 10, 3);

      ctx.fillStyle = '#111111';
      ctx.fillRect(cx - 13, bodyBot, 26, shortsBot - bodyBot);

      // Right (trailing) leg
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx + 3, sockTop, 10, legBot - sockTop - 3);
      ctx.fillStyle = '#74ACDF';
      ctx.fillRect(cx + 3, sockTop, 10, 3);
      ctx.fillStyle = '#111';
      ctx.fillRect(cx + 2, legBot - 3, 12, 3);

      // Left (leading / kick) leg
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 13 + kickExtra, sockTop, 10, legBot - sockTop - 3);
      ctx.fillStyle = '#74ACDF';
      ctx.fillRect(cx - 13 + kickExtra, sockTop, 10, 3);
      ctx.fillStyle = '#111';
      ctx.fillRect(cx - 14 + kickExtra, legBot - 3, 12, 3);

      ctx.fillStyle = '#D4956A';
      ctx.beginPath();
      ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1A1A1A';
      ctx.beginPath();
      ctx.arc(headCX, headCY, headR, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.fillRect(headCX - 4, headCY + 1, 3, 2);
      ctx.fillRect(headCX + 1, headCY + 1, 3, 2);
    }
  }

  function drawBall(ball) {
    // Ground shadow
    ctx.fillStyle = SHADOW_COLOR;
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y, C.SHADOW_RADIUS, C.SHADOW_RADIUS * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const bx = ball.drawX;
    const by = ball.drawY;
    const r  = C.BALL_RADIUS;

    // White base
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();

    // Black patches — center pentagon + 5 satellite spots
    ctx.fillStyle = '#111111';

    // Central patch
    ctx.beginPath();
    ctx.arc(bx, by, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // 5 satellite patches at 72° intervals
    const patchR   = r * 0.22;
    const patchDist = r * 0.58;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
      const px = bx + Math.cos(angle) * patchDist;
      const py = by + Math.sin(angle) * patchDist;
      ctx.beginPath();
      ctx.arc(px, py, patchR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outline
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawHUD(playerScore, cpuScore, playerGames, cpuGames, touchCount, gameMode) {
    const w = 200, h = gameMode === 'single' ? 48 : 64;
    const x = C.CANVAS_W / 2 - w / 2;
    const y = 5;

    ctx.fillStyle = HUD_BG;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();

    if (gameMode === 'set') {
      ctx.font = 'bold 26px Courier New';
      ctx.textAlign = 'right';
      ctx.fillStyle = PLAYER_COLOR;
      ctx.fillText(playerGames, x + w / 2 - 12, y + 28);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('-', C.CANVAS_W / 2, y + 28);
      ctx.fillStyle = CPU_COLOR;
      ctx.textAlign = 'left';
      ctx.fillText(cpuGames, x + w / 2 + 12, y + 28);

      ctx.font = '10px Courier New';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('GAMES', C.CANVAS_W / 2, y + 38);

      ctx.font = 'bold 14px Courier New';
      ctx.textAlign = 'right';
      ctx.fillStyle = PLAYER_COLOR;
      ctx.fillText(playerScore, x + w / 2 - 10, y + 54);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('-', C.CANVAS_W / 2, y + 54);
      ctx.fillStyle = CPU_COLOR;
      ctx.textAlign = 'left';
      ctx.fillText(cpuScore, x + w / 2 + 10, y + 54);
    } else {
      ctx.font = 'bold 26px Courier New';
      ctx.textAlign = 'right';
      ctx.fillStyle = PLAYER_COLOR;
      ctx.fillText(playerScore, x + w / 2 - 12, y + 32);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('-', C.CANVAS_W / 2, y + 32);
      ctx.fillStyle = CPU_COLOR;
      ctx.textAlign = 'left';
      ctx.fillText(cpuScore, x + w / 2 + 12, y + 32);

      ctx.font = '10px Courier New';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('FIRST TO 5', C.CANVAS_W / 2, y + 44);
    }

    // Touch pips (green when active)
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = i < touchCount ? '#7dff9a' : 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.arc(C.COURT_PAD + 14 + i * 18, C.CANVAS_H - C.COURT_PAD - 14, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHUDContinuous(score, highScore, lives) {
    const w = 180, h = 52;
    const x = C.CANVAS_W / 2 - w / 2;
    const y = 5;

    ctx.fillStyle = HUD_BG;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Courier New';
    ctx.fillStyle = '#7dff9a';
    ctx.fillText(score, C.CANVAS_W / 2, y + 32);

    ctx.font = '11px Courier New';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(`BEST: ${highScore}`, C.CANVAS_W / 2, y + 46);

    // Lives as hearts
    for (let i = 0; i < C.LIVES; i++) {
      ctx.fillStyle = i < lives ? '#f05050' : 'rgba(255,255,255,0.15)';
      const hx = C.COURT_PAD + 14 + i * 22;
      const hy = C.COURT_PAD + 14;
      ctx.beginPath();
      ctx.arc(hx - 4, hy - 2, 5, Math.PI, 0);
      ctx.arc(hx + 4, hy - 2, 5, Math.PI, 0);
      ctx.lineTo(hx, hy + 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawTouchFeedback(entity, label) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font      = 'bold 13px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(label, entity.x, entity.y - C.PLAYER_H / 2 - 22);
  }

  function drawMenu(selectedMode, highScore) {
    // Draw the court as the menu background
    drawCourt();

    // Dark green overlay for readability
    ctx.fillStyle = 'rgba(0,25,8,0.72)';
    ctx.fillRect(0, 0, C.CANVAS_W, C.CANVAS_H);

    ctx.textAlign = 'center';

    // Title
    ctx.fillStyle = '#f5e642';
    ctx.font = 'bold 52px Courier New';
    ctx.fillText('SOCCER', C.CANVAS_W / 2, 118);
    ctx.fillStyle = '#7dff9a';
    ctx.font = 'bold 52px Courier New';
    ctx.fillText('TENNIS', C.CANVAS_W / 2, 178);

    // Controls hint
    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.font = '12px Courier New';
    ctx.fillText('ARROWS: move    Z: settle    X: shoot    XX: spike    ESC: menu', C.CANVAS_W / 2, 215);

    // Mode label
    ctx.fillStyle = 'rgba(255,255,255,0.80)';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText('SELECT MODE', C.CANVAS_W / 2, 258);

    const modes  = ['continuous', 'single', 'set'];
    const labels = ['CONTINUOUS', 'SINGLE', 'SET'];
    const descs  = ['3 lives · endless', 'First to 5 pts', '5 games · win by 2'];
    const btnColor = '#3ecf60';
    const selColor = '#2ab87a';

    modes.forEach((m, i) => {
      const bx       = C.CANVAS_W / 2 - 200 + i * 140;
      const by       = 270;
      const bw       = 120, bh = 54;
      const selected = selectedMode === m;

      ctx.fillStyle = selected ? btnColor : 'rgba(255,255,255,0.10)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 7);
      ctx.fill();

      if (selected) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth   = 2;
        ctx.stroke();
      }

      ctx.fillStyle = selected ? '#002208' : 'rgba(255,255,255,0.80)';
      ctx.font      = `bold 13px Courier New`;
      ctx.fillText(labels[i], bx + bw / 2, by + 24);

      ctx.fillStyle = selected ? 'rgba(0,20,5,0.75)' : 'rgba(255,255,255,0.40)';
      ctx.font      = '10px Courier New';
      ctx.fillText(descs[i], bx + bw / 2, by + 40);
    });

    // High score
    if (highScore > 0) {
      ctx.fillStyle = 'rgba(125,255,154,0.6)';
      ctx.font = '12px Courier New';
      ctx.fillText(`CONTINUOUS BEST: ${highScore}`, C.CANVAS_W / 2, 346);
    }

    // Click prompt
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('CLICK A MODE TO START', C.CANVAS_W / 2, 400);
  }

  function drawServePrompt(isPlayer) {
    const msg = isPlayer ? 'YOUR SERVE — PRESS X' : 'CPU SERVES…';
    ctx.fillStyle = 'rgba(0,50,20,0.78)';
    ctx.fillRect(C.CANVAS_W / 2 - 170, C.CANVAS_H / 2 - 24, 340, 46);
    ctx.strokeStyle = 'rgba(125,255,154,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(C.CANVAS_W / 2 - 170, C.CANVAS_H / 2 - 24, 340, 46);
    ctx.fillStyle = '#f5e642';
    ctx.font = 'bold 18px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(msg, C.CANVAS_W / 2, C.CANVAS_H / 2 + 6);
  }

  function drawPointEnd(msg) {
    ctx.fillStyle = 'rgba(0,55,20,0.82)';
    ctx.fillRect(0, C.CANVAS_H / 2 - 40, C.CANVAS_W, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(msg, C.CANVAS_W / 2, C.CANVAS_H / 2 + 10);
  }

  function drawGameOver(playerWon, playerGames, cpuGames, gameMode) {
    ctx.fillStyle = 'rgba(0,35,15,0.92)';
    ctx.fillRect(0, 0, C.CANVAS_W, C.CANVAS_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = playerWon ? '#f5e642' : '#f05050';
    ctx.font = 'bold 52px Courier New';
    ctx.fillText(playerWon ? 'YOU WIN!' : 'YOU LOSE', C.CANVAS_W / 2, C.CANVAS_H / 2 - 40);

    if (gameMode === 'set') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 28px Courier New';
      ctx.fillText(`${playerGames} — ${cpuGames}  GAMES`, C.CANVAS_W / 2, C.CANVAS_H / 2 + 10);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 15px Courier New';
    ctx.fillText('ENTER: menu    ESC: menu', C.CANVAS_W / 2, C.CANVAS_H / 2 + 55);
  }

  function drawGameOverContinuous(score, highScore) {
    ctx.fillStyle = 'rgba(0,35,15,0.92)';
    ctx.fillRect(0, 0, C.CANVAS_W, C.CANVAS_H);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#f05050';
    ctx.font = 'bold 52px Courier New';
    ctx.fillText('GAME OVER', C.CANVAS_W / 2, C.CANVAS_H / 2 - 50);

    ctx.fillStyle = '#7dff9a';
    ctx.font = 'bold 34px Courier New';
    ctx.fillText(`SCORE: ${score}`, C.CANVAS_W / 2, C.CANVAS_H / 2 + 10);

    const newBest = score >= highScore && score > 0;
    ctx.fillStyle = newBest ? '#f5e642' : 'rgba(255,255,255,0.50)';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText(newBest ? 'NEW BEST!' : `BEST: ${highScore}`, C.CANVAS_W / 2, C.CANVAS_H / 2 + 42);

    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.font = 'bold 15px Courier New';
    ctx.fillText('ENTER: menu    ESC: menu', C.CANVAS_W / 2, C.CANVAS_H / 2 + 72);
  }

  return {
    init, clear, drawCourt, drawEntity, drawBall,
    drawHUD, drawHUDContinuous,
    drawTouchFeedback,
    drawMenu, drawServePrompt, drawPointEnd,
    drawGameOver, drawGameOverContinuous,
    PLAYER_COLOR, CPU_COLOR
  };
})();
