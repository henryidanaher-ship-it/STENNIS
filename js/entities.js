class Entity {
  constructor(x, y, side) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.touchCount = 0;
    this.settled = false;
    this.animState = 'idle';  // 'idle' | 'kick' | 'header'
    this.animTimer = 0;
  }

  triggerAnim(state) {
    this.animState = state;
    this.animTimer = 20;
  }

  updateAnim() {
    if (this.animTimer > 0 && --this.animTimer === 0) this.animState = 'idle';
  }

  get halfMinX() {
    return this.side === 'player'
      ? C.COURT_PAD + C.PLAYER_W / 2
      : C.CANVAS_W / 2 + C.NET_THICKNESS / 2 + C.PLAYER_W / 2;
  }

  get halfMaxX() {
    return this.side === 'player'
      ? C.CANVAS_W / 2 - C.NET_THICKNESS / 2 - C.PLAYER_W / 2
      : C.CANVAS_W - C.COURT_PAD - C.PLAYER_W / 2;
  }

  get halfMinY() { return C.COURT_PAD + C.PLAYER_H / 2; }
  get halfMaxY() { return C.CANVAS_H - C.COURT_PAD - C.PLAYER_H / 2; }

  clamp() {
    this.x = Math.max(this.halfMinX, Math.min(this.halfMaxX, this.x));
    this.y = Math.max(this.halfMinY, Math.min(this.halfMaxY, this.y));
  }

  resetTouch() {
    this.touchCount = 0;
    this.settled = false;
  }

  canTouch(ball) {
    const dx = ball.x - this.x;
    const dy = ball.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= C.TOUCH_RADIUS &&
           ball.z <= C.TOUCH_MAX_Z &&
           this.touchCount < 2;
  }

  settleTouch(ball) {
    if (!this.canTouch(ball)) return false;
    const forward = this.side === 'player' ? 1 : -1;
    ball.vx = ball.vx * C.SETTLE_DAMP + forward * C.SETTLE_FORWARD;
    ball.vy *= C.SETTLE_DAMP;
    ball.vz = C.SETTLE_VZ;
    ball.bounceCount = 0;  // controlled touch resets bounce window
    ball.lastToucher = this.side;
    this.touchCount++;
    this.settled = true;
    Audio.kick();
    this.triggerAnim(ball.z > 25 ? 'header' : 'kick');
    return true;
  }

  shootTouch(ball, targetX, targetY, speed = C.SHOOT_SPEED, vz = C.SHOOT_VZ) {
    if (!this.canTouch(ball)) return false;
    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    ball.vx = (dx / dist) * speed;
    ball.vy = (dy / dist) * speed;
    ball.vz = vz;
    ball.lastToucher = this.side;
    ball.inPlay = true;
    this.touchCount++;
    Audio.shoot();
    this.triggerAnim(ball.z > 25 ? 'header' : 'kick');
    return true;
  }
}

// ─── Player ─────────────────────────────────────────────────────────────────

class Player extends Entity {
  constructor() {
    super(C.COURT_PAD + 80, C.CANVAS_H / 2, 'player');
  }

  resetPosition() {
    this.x = C.COURT_PAD + 80;
    this.y = C.CANVAS_H / 2;
  }

  canTouch(ball) {
    const dx = ball.x - this.x;
    const dy = ball.y - this.y;
    const radius = this.settled ? C.SETTLED_TOUCH_RADIUS : C.TOUCH_RADIUS;
    return Math.sqrt(dx * dx + dy * dy) <= radius &&
           ball.z <= C.TOUCH_MAX_Z &&
           this.touchCount < 2;
  }

  update(keys) {
    if (keys['ArrowUp'])    this.y -= C.PLAYER_SPEED;
    if (keys['ArrowDown'])  this.y += C.PLAYER_SPEED;
    if (keys['ArrowLeft'])  this.x -= C.PLAYER_SPEED;
    if (keys['ArrowRight']) this.x += C.PLAYER_SPEED;
    this.clamp();
  }

  getAim() {
    // Standing near back of half → deep shot; near net → short drop
    const halfW = C.CANVAS_W / 2 - C.COURT_PAD;
    const t = Math.max(0, Math.min(1, (this.x - C.COURT_PAD) / halfW));
    const aimX = (C.CANVAS_W - C.COURT_PAD - 50) - t * 300;
    const aimY = C.CANVAS_H / 2 + (this.y - C.CANVAS_H / 2) * 0.5;
    return { aimX, aimY };
  }
}

// ─── CPU ─────────────────────────────────────────────────────────────────────

class CPU extends Entity {
  constructor(difficulty) {
    super(C.CANVAS_W - C.COURT_PAD - 80, C.CANVAS_H / 2, 'cpu');
    this.setDifficulty(difficulty);
    this._reactionTimer = 0;
    this._targetX = this.x;
    this._targetY = this.y;
  }

  setDifficulty(difficulty) {
    this.profile = C.DIFFICULTY[difficulty] || C.DIFFICULTY.medium;
  }

  resetPosition() {
    this.x = C.CANVAS_W - C.COURT_PAD - 80;
    this.y = C.CANVAS_H / 2;
  }

  _predictLanding(ball) {
    // Simulate ball trajectory until z hits 0
    let px = ball.x, py = ball.y, pz = ball.z;
    let pvx = ball.vx, pvy = ball.vy, pvz = ball.vz;
    for (let i = 0; i < 200; i++) {
      pvz -= C.GRAVITY;
      px += pvx; py += pvy; pz += pvz;
      if (pz <= 0) return { x: px, y: py };
    }
    return { x: px, y: py };
  }

  update(ball) {
    if (ball.side !== 'cpu' || !ball.inPlay) {
      // Drift back to center of own half
      const homeX = C.CANVAS_W - C.COURT_PAD - 80;
      const homeY = C.CANVAS_H / 2;
      const ddx = homeX - this.x;
      const ddy = homeY - this.y;
      const d = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      const s = Math.min(this.profile.speed * 0.5, d);
      this.x += (ddx / d) * s;
      this.y += (ddy / d) * s;
      this.clamp();
      return;
    }

    // Reaction delay
    if (this._reactionTimer < this.profile.reactionDelay) {
      this._reactionTimer++;
      return;
    }

    // Predict where ball lands, update target occasionally
    if (this._reactionTimer === this.profile.reactionDelay) {
      const landing = this._predictLanding(ball);
      const spread = this.profile.aimSpread;
      this._targetX = landing.x + (Math.random() - 0.5) * spread;
      this._targetY = landing.y + (Math.random() - 0.5) * spread;
      this._targetX = Math.max(this.halfMinX, Math.min(this.halfMaxX, this._targetX));
      this._targetY = Math.max(this.halfMinY, Math.min(this.halfMaxY, this._targetY));
      this._reactionTimer++;
    }

    // Move toward target
    const ddx = this._targetX - this.x;
    const ddy = this._targetY - this.y;
    const d = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
    const s = Math.min(this.profile.speed, d);
    this.x += (ddx / d) * s;
    this.y += (ddy / d) * s;
    this.clamp();

    // Touch logic
    if (this.canTouch(ball)) {
      const spread = this.profile.aimSpread;
      // Vary depth and target corners
      const depth  = 0.08 + Math.random() * 0.22;          // 0.08–0.30 of canvas width
      const topBot = Math.random() < 0.5 ? 0.20 : 0.80;    // aim top or bottom third
      const aimX = C.CANVAS_W * depth + (Math.random() - 0.5) * spread;
      const aimY = C.CANVAS_H * topBot + (Math.random() - 0.5) * spread * 1.5;

      if (!this.settled && ball.vz < 2 && this.touchCount === 0) {
        this.settleTouch(ball);
        this._reactionTimer = this.profile.reactionDelay;
      } else {
        const spd    = this.profile.shootSpeed * (0.92 + Math.random() * 0.1);
        const vzShot = C.SHOOT_VZ * (spd / C.SHOOT_SPEED);
        this.shootTouch(ball, aimX, aimY, spd, Math.min(vzShot, C.SHOOT_VZ * 1.2));
        this._reactionTimer = 0;
      }
    }
  }

  onBallEntersHalf() {
    this._reactionTimer = 0;
  }
}
