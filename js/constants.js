const C = {
  // Canvas
  CANVAS_W: 900,
  CANVAS_H: 500,

  // Court
  COURT_PAD: 30,       // inset from canvas edge
  NET_THICKNESS: 8,

  // Physics
  GRAVITY: 0.35,
  BOUNCE_DAMPING: 0.55,
  GROUND_FRICTION: 0.92,
  NET_HEIGHT: 28,       // ball must be above this z to clear net
  NET_BOUNCE_VZ: 4,

  // Touch thresholds
  TOUCH_RADIUS: 72,          // reach for a direct (no-settle) touch
  SETTLED_TOUCH_RADIUS: 110, // larger reach after a settle touch
  TOUCH_MAX_Z: 100,          // max height at which a touch is valid
  SETTLE_VZ: 9,              // upward flick on settle — higher = more time to shoot
  SETTLE_DAMP: 0.12,    // how much settle kills horizontal speed
  SETTLE_FORWARD: 1.2,  // forward nudge added toward opponent on settle

  // Shot values
  CPU_SERVE_SPEED: 5.5,  // softer than a rally shot so serve is returnable
  SHOOT_SPEED: 8.5,
  SHOOT_VZ: 9.0,
  SPIKE_SPEED: 13.0,
  SPIKE_VZ: 6.0,        // flatter arc on spike
  DOUBLE_TAP_FRAMES: 18, // window to register a double-tap

  // Entities
  PLAYER_SPEED: 6.5,
  PLAYER_W: 40,
  PLAYER_H: 50,

  // Ball visuals
  BALL_RADIUS: 10,
  SHADOW_RADIUS: 10,
  HEIGHT_SCALE: 0.7,    // px of visual offset per unit of z

  // Scoring
  WIN_SCORE: 5,   // points to win a game
  WIN_GAMES: 5,   // games to win the set (win by 2)

  LIVES: 3,             // starting lives in Continuous mode

  // Timing
  POINT_END_DELAY: 1500, // ms before next serve prompt

  // Difficulty profiles — shootSpeed is the CPU's equivalent of charge power
  DIFFICULTY: {
    easy:   { speed: 2.8,  reactionDelay: 22, aimSpread: 42, shootSpeed: 5.0 },
    medium: { speed: 4.0,  reactionDelay: 9,  aimSpread: 18, shootSpeed: 7.0 },
    hard:   { speed: 5.8,  reactionDelay: 0,  aimSpread: 4,  shootSpeed: 9.0 }
  }
};
