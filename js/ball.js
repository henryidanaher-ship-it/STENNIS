class Ball {
  constructor() {
    this.reset('player');
  }

  reset(servingSide) {
    const netX = C.CANVAS_W / 2;
    const midY = C.CANVAS_H / 2;

    if (servingSide === 'player') {
      this.x = C.COURT_PAD + 80;
      this.y = midY;
    } else {
      this.x = C.CANVAS_W - C.COURT_PAD - 80;
      this.y = midY;
    }

    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.bounceCount = 0;
    this.lastToucher = null;
    this.side = servingSide;
    this.inPlay = false;   // true once the server shoots
  }

  get netX() { return C.CANVAS_W / 2; }

  update() {
    if (!this.inPlay) return null;

    // apply gravity
    this.vz -= C.GRAVITY;

    // move
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    const minX = C.COURT_PAD;
    const maxX = C.CANVAS_W - C.COURT_PAD;
    const minY = C.COURT_PAD;
    const maxY = C.CANVAS_H - C.COURT_PAD;

    // ground bounce — out-of-bounds is only checked on landing
    let fault = null;
    if (this.z <= 0) {
      this.z = 0;
      if (Math.abs(this.vz) > 0.5) {
        this.vz = Math.abs(this.vz) * C.BOUNCE_DAMPING;
        this.vx *= C.GROUND_FRICTION;
        this.vy *= C.GROUND_FRICTION;
        this.bounceCount++;
        Audio.bounce();

        // Ball landed outside the white lines
        if (this.x < minX) {
          // Past player's back line — player loses
          fault = { loser: 'player' };
        } else if (this.x > maxX) {
          // Past CPU's back line — CPU loses
          fault = { loser: 'cpu' };
        } else if (this.y < minY || this.y > maxY) {
          // Out the sides — whoever hit it wide loses
          fault = { loser: this.lastToucher || this.side };
        } else if (this.bounceCount >= 2) {
          // Two bounces in court — owner of that side loses
          fault = { loser: this.side };
        }
      } else {
        this.vz = 0;
        this.vx *= C.GROUND_FRICTION;
        this.vy *= C.GROUND_FRICTION;
      }
    }

    // net check
    const prevX = this.x - this.vx;
    const crossedNet = (prevX < this.netX && this.x >= this.netX) ||
                       (prevX > this.netX && this.x <= this.netX);
    if (crossedNet) {
      if (this.z >= C.NET_HEIGHT) {
        this.side = (this.x >= this.netX) ? 'cpu' : 'player';
        this.bounceCount = 0;
      } else {
        this.vx *= -0.5;
        this.vz = C.NET_BOUNCE_VZ;
        this.x = this.x >= this.netX
          ? this.netX - C.NET_THICKNESS / 2 - 1
          : this.netX + C.NET_THICKNESS / 2 + 1;
        Audio.netHit();
      }
    }

    return fault;
  }

  // Visual positions
  get drawX() { return this.x; }
  get drawY() { return this.y - this.z * C.HEIGHT_SCALE; }
}
