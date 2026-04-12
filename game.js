// ============================================================
// T004 — SHARED CONSTANTS
// ============================================================
const CELL            = 28;   // grid cell size in pixels
const COLS            = 20;   // grid columns
const ROWS            = 20;   // grid rows
const CANVAS_W        = 560;  // COLS × CELL
const CANVAS_H        = 600;  // ROWS × CELL + HUD_H
const HUD_H           = 40;   // height reserved above grid

const TICK_BASE       = 150;  // initial tick delay (ms)
const TICK_MIN        = 80;   // minimum tick delay (ms)
const TICK_STEP       = 5;    // ms reduction per speed-up event
const SCORE_PER_SPEEDUP = 5;  // points between speed-up events

// Color palette
const C_BG         = 0x1a1a2e;
const C_HUD_BG     = 0x0f3460;
const C_GRID_A     = 0x16213e;
const C_GRID_B     = 0x1a1a2e;
const C_SNAKE_HEAD = 0x00e676;
const C_SNAKE_BODY = 0x00c853;
const C_FOOD       = 0xffeb3b;

// ============================================================
// T005 — DIRECTION CONSTANTS
// ============================================================
const DIRS = {
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 }
};

// Map each DIRS object reference to its opposite
const OPPOSITES = new Map([
  [DIRS.UP,    DIRS.DOWN],
  [DIRS.DOWN,  DIRS.UP],
  [DIRS.LEFT,  DIRS.RIGHT],
  [DIRS.RIGHT, DIRS.LEFT]
]);

// ============================================================
// T006 — BUTTON HELPER
// ============================================================
function makeButton(scene, cx, cy, label, bgColor, textColor = '#ffffff', w = 200, h = 64) {
  const gfx = scene.add.graphics();

  // Position the Graphics object at (cx, cy) so all drawing and
  // scale tweens use the button centre as pivot.
  gfx.setPosition(cx, cy);
  gfx.fillStyle(bgColor, 1);
  gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 16);

  // Explicit hit-area required for Graphics objects in Phaser 4.
  // Coordinates are relative to the Graphics object's local origin (cx, cy).
  gfx.setInteractive(
    new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
    Phaser.Geom.Rectangle.Contains
  );

  const txt = scene.add.text(cx, cy, label, {
    fontFamily: '"Trebuchet MS", Arial',
    fontSize: '24px',
    fontStyle: 'bold',
    color: textColor
  }).setOrigin(0.5);

  // Hover / press tweens — both targets share the same pivot (cx, cy)
  gfx.on('pointerover', () => {
    scene.tweens.add({ targets: [gfx, txt], scaleX: 1.07, scaleY: 1.07, duration: 100 });
  });
  gfx.on('pointerout', () => {
    scene.tweens.add({ targets: [gfx, txt], scaleX: 1.0, scaleY: 1.0, duration: 100 });
  });
  gfx.on('pointerdown', () => {
    scene.tweens.add({ targets: [gfx, txt], scaleX: 0.93, scaleY: 0.93, duration: 80 });
  });
  gfx.on('pointerup', () => {
    scene.tweens.add({ targets: [gfx, txt], scaleX: 1.07, scaleY: 1.07, duration: 80 });
  });

  return { gfx, txt };
}

// ============================================================
// T007–T015 — GAME SCENE (US1: Play a Full Game Round)
// ============================================================
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  // T007 — scene setup
  create(data) {
    this.state = {
      snake:       [{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }],
      dir:         DIRS.RIGHT,
      nextDir:     DIRS.RIGHT,
      food:        null,
      score:       0,
      personalBest: data?.personalBest ?? 0,  // T018: thread personalBest
      growing:     false,
      tickDelay:   TICK_BASE,
      tickRef:     null
    };

    this.gfx     = this.add.graphics();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys('W,A,S,D');

    // T016 — HUD text objects
    this.scoreTxt = this.add.text(12, HUD_H / 2, 'Pontos: 0', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '22px',
      fontStyle:  'bold',
      color:      '#ffffff'
    }).setOrigin(0, 0.5);

    this.bestTxt = this.add.text(CANVAS_W - 12, HUD_H / 2, 'Melhor: 0', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '22px',
      fontStyle:  'bold',
      color:      '#ffeb3b'
    }).setOrigin(1, 0.5);

    this.spawnFood();
    this.updateHUD();

    this.state.tickRef = this.time.addEvent({
      delay:         TICK_BASE,
      callback:      this.tick,
      callbackScope: this,
      loop:          true
    });
  }

  // T008 — buffer directional input
  update() {
    const JD    = Phaser.Input.Keyboard.JustDown;
    const state = this.state;

    if (JD(this.cursors.up) || JD(this.wasd.W)) {
      if (DIRS.UP !== OPPOSITES.get(state.dir)) state.nextDir = DIRS.UP;
    } else if (JD(this.cursors.down) || JD(this.wasd.S)) {
      if (DIRS.DOWN !== OPPOSITES.get(state.dir)) state.nextDir = DIRS.DOWN;
    } else if (JD(this.cursors.left) || JD(this.wasd.A)) {
      if (DIRS.LEFT !== OPPOSITES.get(state.dir)) state.nextDir = DIRS.LEFT;
    } else if (JD(this.cursors.right) || JD(this.wasd.D)) {
      if (DIRS.RIGHT !== OPPOSITES.get(state.dir)) state.nextDir = DIRS.RIGHT;
    }
  }

  // T009 — core game-loop tick
  tick() {
    const state = this.state;
    state.dir = state.nextDir;

    const newHead = {
      x: state.snake[0].x + state.dir.x,
      y: state.snake[0].y + state.dir.y
    };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
      this.gameOver();
      return;
    }

    // Self collision
    if (state.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      this.gameOver();
      return;
    }

    // Food collision
    if (state.food && newHead.x === state.food.x && newHead.y === state.food.y) {
      state.score++;
      state.growing = true;
      this.spawnFood();
      this.updateSpeed();  // T012
      this.updateHUD();    // T017
    }

    if (!state.growing) {
      state.snake.pop();
    }
    state.snake.unshift(newHead);
    state.growing = false;  // reset — only one extra segment per food eaten

    // Win check
    if (state.snake.length === COLS * ROWS) {
      this.gameWon();
      return;
    }

    this.redraw();
  }

  // T010 — choose a random empty cell for food
  spawnFood() {
    const cells = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (!this.state.snake.some(s => s.x === c && s.y === r)) {
          cells.push({ x: c, y: r });
        }
      }
    }
    this.state.food = cells[Math.floor(Math.random() * cells.length)];
    this.redraw();
  }

  // T011 — render grid, food, and snake
  redraw() {
    const gfx   = this.gfx;
    const state = this.state;
    gfx.clear();

    // HUD bar
    gfx.fillStyle(C_HUD_BG, 1);
    gfx.fillRect(0, 0, CANVAS_W, HUD_H);

    // Checkerboard grid
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        gfx.fillStyle((c + r) % 2 === 0 ? C_GRID_A : C_GRID_B, 1);
        gfx.fillRect(c * CELL, HUD_H + r * CELL, CELL, CELL);
      }
    }

    // Food
    if (state.food) {
      gfx.fillStyle(C_FOOD, 1);
      gfx.fillRoundedRect(
        state.food.x * CELL + 3,
        HUD_H + state.food.y * CELL + 3,
        CELL - 6, CELL - 6, 6
      );
    }

    // Snake body (all segments except head)
    gfx.fillStyle(C_SNAKE_BODY, 1);
    for (let i = 1; i < state.snake.length; i++) {
      const s = state.snake[i];
      gfx.fillRoundedRect(s.x * CELL + 2, HUD_H + s.y * CELL + 2, CELL - 4, CELL - 4, 4);
    }

    // Snake head
    const head = state.snake[0];
    gfx.fillStyle(C_SNAKE_HEAD, 1);
    gfx.fillRoundedRect(head.x * CELL + 1, HUD_H + head.y * CELL + 1, CELL - 2, CELL - 2, 6);
  }

  // T012 — decrease tick delay every SCORE_PER_SPEEDUP points
  updateSpeed() {
    const state = this.state;
    if (state.score > 0 && state.score % SCORE_PER_SPEEDUP === 0) {
      const newDelay = Math.max(TICK_MIN, state.tickDelay - TICK_STEP);
      if (newDelay !== state.tickDelay) {
        state.tickDelay = newDelay;
        state.tickRef.remove(false);
        state.tickRef = this.time.addEvent({
          delay:         newDelay,
          callback:      this.tick,
          callbackScope: this,
          loop:          true
        });
      }
    }
  }

  // T017 — refresh HUD score & personal best texts
  updateHUD() {
    this.scoreTxt.setText('Pontos: ' + this.state.score);
    this.bestTxt.setText('Melhor: ' + this.state.personalBest);
  }

  // T013 — game over: red flash then transition
  gameOver() {
    this.state.tickRef.remove(false);
    const overlay = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0xff0000, 0);
    this.tweens.add({
      targets:  overlay,
      alpha:    0.4,
      duration: 350,
      yoyo:     true
    });
    this.time.delayedCall(850, () => {
      this.scene.start('GameOverScene', {
        score:        this.state.score,
        personalBest: Math.max(this.state.score, this.state.personalBest),  // T018
        won:          false
      });
    });
  }

  // T014 — win: gold flash then transition
  gameWon() {
    this.state.tickRef.remove(false);
    const overlay = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0xffd700, 0);
    this.tweens.add({
      targets:  overlay,
      alpha:    0.4,
      duration: 350,
      yoyo:     true
    });
    this.time.delayedCall(850, () => {
      this.scene.start('GameOverScene', {
        score:        this.state.score,
        personalBest: Math.max(this.state.score, this.state.personalBest),  // T018
        won:          true
      });
    });
  }
}

// ============================================================
// T015 + T019 — GAME OVER SCENE (US1 + US2)
// ============================================================
class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data) {
    // Dark overlay
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.82);

    // Title
    const titleText  = data.won ? '🏆 VOCÊ VENCEU!' : '💥 FIM DE JOGO!';
    const titleColor = data.won ? '#ffd700' : '#ff5252';
    this.add.text(CANVAS_W / 2, CANVAS_H * 0.28, titleText, {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '48px',
      fontStyle:  'bold',
      color:      titleColor
    }).setOrigin(0.5);

    // Final score
    this.add.text(CANVAS_W / 2, CANVAS_H * 0.45, 'Pontuação: ' + data.score, {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '32px',
      fontStyle:  'bold',
      color:      '#ffffff'
    }).setOrigin(0.5);

    // T019 — personal best
    this.add.text(CANVAS_W / 2, CANVAS_H * 0.54, 'Melhor: ' + data.personalBest, {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '26px',
      fontStyle:  'bold',
      color:      '#00e676'
    }).setOrigin(0.5);

    // T019 — new-record celebration
    if (data.score > 0 && data.score >= data.personalBest) {
      const rec = this.add.text(CANVAS_W / 2, CANVAS_H * 0.63, '🏆 Novo Recorde!', {
        fontFamily: '"Trebuchet MS", Arial',
        fontSize:   '26px',
        fontStyle:  'bold',
        color:      '#ffd700'
      }).setOrigin(0.5);
      this.tweens.add({
        targets:  rec,
        scaleX:   1.15,
        scaleY:   1.15,
        duration: 600,
        yoyo:     true,
        repeat:   -1
      });
    }

    // Play Again button
    const btn = makeButton(
      this, CANVAS_W / 2, CANVAS_H * 0.72,
      '🎮 JOGAR NOVAMENTE', 0x00c853, '#ffffff', 260, 64
    );

    // Guard against double-trigger from button + keyboard
    let going = false;
    const restart = () => {
      if (going) return;
      going = true;
      this.scene.start('GameScene', { personalBest: data.personalBest });  // T018
    };

    btn.gfx.on('pointerup', restart);
    this.input.keyboard.on('keydown-SPACE', restart);
    this.input.keyboard.on('keydown-ENTER', restart);
  }
}

// ============================================================
// T020–T023 — MENU SCENE (US3: Start Screen)
// ============================================================
class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(data) {
    this.personalBest = data?.personalBest ?? 0;

    // Background fill (Phaser clears to backgroundColor; explicit rect for safety)
    const bg = this.add.graphics();
    bg.fillStyle(C_BG, 1);
    bg.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // T020 — title with pulse tween
    const title = this.add.text(CANVAS_W / 2, CANVAS_H * 0.22, '🐍 SNAKE!', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '72px',
      fontStyle:  'bold',
      color:      '#00e676'
    }).setOrigin(0.5);
    this.tweens.add({
      targets:  title,
      scaleX:   1.06,
      scaleY:   1.06,
      duration: 1100,
      yoyo:     true,
      repeat:   -1
    });

    // T021 — instruction text
    this.add.text(CANVAS_W / 2, CANVAS_H * 0.42, 'Use  ↑↓←→  ou  W A S D', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '20px',
      color:      '#cccccc'
    }).setOrigin(0.5);

    // T021 — JOGAR button
    const btn = makeButton(
      this, CANVAS_W / 2, CANVAS_H * 0.58,
      '🎮  JOGAR', 0x00c853, '#ffffff', 220, 64
    );

    // Guard against double-trigger
    let going = false;
    const startGame = () => {
      if (going) return;
      going = true;
      this.scene.start('GameScene', { personalBest: this.personalBest });
    };

    btn.gfx.on('pointerup', startGame);

    // T022 — keyboard shortcuts
    this.input.keyboard.on('keydown-SPACE', startGame);
    this.input.keyboard.on('keydown-ENTER', startGame);

    // T023 — personal best display (only when > 0)
    if (this.personalBest > 0) {
      this.add.text(CANVAS_W / 2, CANVAS_H * 0.75, '⭐ Melhor: ' + this.personalBest, {
        fontFamily: '"Trebuchet MS", Arial',
        fontSize:   '22px',
        fontStyle:  'bold',
        color:      '#ffeb3b'
      }).setOrigin(0.5);
    }
  }
}

// ============================================================
// T024 — PHASER GAME BOOTSTRAP
// ============================================================
const config = {
  type:            Phaser.AUTO,
  width:           CANVAS_W,
  height:          CANVAS_H,
  backgroundColor: '#1a1a2e',
  parent:          document.body,
  scene:           [MenuScene, GameScene, GameOverScene]
};

new Phaser.Game(config);
