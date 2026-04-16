// ============================================================
// SHARED CONSTANTS
// ============================================================
const isMobile     = window.matchMedia('(pointer: coarse)').matches;
const HUD_H        = 40;   // height reserved above grid
const CARD_STRIP_H = 32;   // card strip below grid

// Mobile: non-square grid fills both screen axes.
// Portrait  → CELL from width  (fix 13 columns), ROWS fill remaining height.
// Landscape → CELL from height (fix 13 rows),    COLS fill remaining width.
const _portrait    = isMobile && (window.innerWidth <= window.innerHeight);
const CELL         = isMobile
  ? (_portrait
      ? Math.floor(window.innerWidth / 13)
      : Math.floor((window.innerHeight - HUD_H - CARD_STRIP_H) / 13))
  : 28;
const COLS         = isMobile
  ? (_portrait ? 13 : Math.floor(window.innerWidth / CELL))
  : 20;
const ROWS         = isMobile
  ? (_portrait ? Math.floor((window.innerHeight - HUD_H - CARD_STRIP_H) / CELL) : 13)
  : 20;
const CANVAS_W     = COLS * CELL;
const CANVAS_H     = HUD_H + ROWS * CELL + CARD_STRIP_H;

const TICK_BASE         = 150;  // initial tick delay (ms)
const TICK_MIN          = 80;   // minimum tick delay (ms)
const TICK_STEP         = 5;    // ms reduction per speed-up event
const SCORE_PER_SPEEDUP = 5;    // points between speed-up events

const RUSH_BOOST_DURATION = 5000; // ms
const RUSH_SPEED_FACTOR   = 1.5;
const STAR_SPEED_FACTOR   = 2;   // STAR timer delay = baseDelay × 2

// Color palette
const C_BG         = 0x1a1a2e;
const C_HUD_BG     = 0x0f3460;
const C_GRID_A     = 0x16213e;
const C_GRID_B     = 0x1a1a2e;
const C_SNAKE_HEAD = 0x00e676;
const C_SNAKE_BODY = 0x00c853;
const C_FOOD       = 0xffeb3b;
const C_OBSTACLE   = 0x455a64;

// Food type keys
const FOOD_TYPES = {
  STANDARD: 'STANDARD', PENTA: 'PENTA',
  RUSH: 'RUSH', STAR: 'STAR', BOMB: 'BOMB'
};

// Colors per food type
const FOOD_COLORS = {
  STANDARD: 0xffeb3b, PENTA: 0xffc400,
  RUSH: 0xaa00ff, STAR: 0xffffff, BOMB: 0xb71c1c
};

// Card generation weights
const RARITY_WEIGHTS = {
  STANDARD: 80, RUSH: 7, STAR: 1, PENTA: 9, BOMB: 3
};
const CARD_SIZE_WEIGHTS = [
  { size: 1, w: 84 }, { size: 2, w: 12 }, { size: 3, w: 3 }, { size: 4, w: 1 }
];

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
// DRAWING HELPERS (T004, T005)
// ============================================================

// Draw a food item centered at pixel (cx, cy) on the shared Graphics layer.
function drawFoodShape(gfx, food, cx, cy) {
  const S = CELL / 28; // scale factor relative to base CELL=28
  gfx.fillStyle(FOOD_COLORS[food.type], 1);
  switch (food.type) {
    case FOOD_TYPES.STANDARD: {
      const hs = Math.round(11 * S);
      gfx.fillRoundedRect(cx - hs, cy - hs, hs * 2, hs * 2, Math.max(2, Math.round(5 * S)));
      break;
    }
    case FOOD_TYPES.PENTA: {
      // 5-point star — 10 vertices, alternating r_outer / r_inner
      const rO = Math.round(12 * S), rI = Math.round(6 * S);
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? rO : rI;
        pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
      }
      gfx.fillPoints(pts, true, true);
      break;
    }
    case FOOD_TYPES.RUSH: {
      // Wide flat pill
      const hw = Math.round(12 * S), hh = Math.max(2, Math.round(5 * S));
      gfx.fillRoundedRect(cx - hw, cy - hh, hw * 2, hh * 2, Math.max(2, Math.round(5 * S)));
      break;
    }
    case FOOD_TYPES.STAR: {
      // 4-point star — 8 vertices, r_outer / r_inner
      // Skip draw on blink-off frames (T034 visibility toggle)
      if (food.visible === false) break;
      const rO = Math.round(11 * S), rI = Math.max(2, Math.round(5 * S));
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i - Math.PI / 2;
        const r = i % 2 === 0 ? rO : rI;
        pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
      }
      gfx.fillPoints(pts, true, true);
      break;
    }
    case FOOD_TYPES.BOMB: {
      // Dark red circle with X crosshair
      const br = Math.round(10 * S), bl = Math.round(6 * S);
      gfx.fillCircle(cx, cy, br);
      gfx.lineStyle(Math.max(1, Math.round(2 * S)), 0x7f0000, 1);
      gfx.lineBetween(cx - bl, cy - bl, cx + bl, cy + bl);
      gfx.lineBetween(cx + bl, cy - bl, cx - bl, cy + bl);
      break;
    }
  }
}

// Draw a FOOD-BOMB obstacle tile at grid cell (obs.x, obs.y).
function drawObstacle(gfx, obs) {
  const S = CELL / 28;
  const c = Math.max(2, Math.round(4 * S));
  gfx.fillStyle(C_OBSTACLE, 1);
  gfx.fillRect(obs.x * CELL, HUD_H + obs.y * CELL, CELL, CELL);
  gfx.lineStyle(Math.max(1, Math.round(2 * S)), 0x263238, 1);
  gfx.lineBetween(
    obs.x * CELL + c,        HUD_H + obs.y * CELL + c,
    obs.x * CELL + CELL - c, HUD_H + obs.y * CELL + CELL - c
  );
  gfx.lineBetween(
    obs.x * CELL + CELL - c, HUD_H + obs.y * CELL + c,
    obs.x * CELL + c,        HUD_H + obs.y * CELL + CELL - c
  );
}

// ============================================================
// CARD GENERATION — fetchNextCard (T006)
// ============================================================

// Internal weighted random picker.
function _weightedPick(weightMap) {
  const total = Object.values(weightMap).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [key, w] of Object.entries(weightMap)) {
    roll -= w;
    if (roll <= 0) return key;
  }
  return Object.keys(weightMap)[0];
}

// ============================================================
// SPECIAL FOODS PREFERENCE (localStorage)
// ============================================================
function isSpecialFoodsEnabled() {
  try { return localStorage.getItem('snakeSpecialFoodsEnabled') === 'true'; }
  catch (e) { return false; }
}

function setSpecialFoodsEnabled(enabled) {
  try { localStorage.setItem('snakeSpecialFoodsEnabled', String(enabled)); }
  catch (e) { /* best-effort; ignore storage errors */ }
}

function getPersonalBest() {
  try { return parseInt(localStorage.getItem('snakePersonalBest'), 10) || 0; }
  catch (e) { return 0; }
}

function savePersonalBest(score) {
  try { localStorage.setItem('snakePersonalBest', String(score)); }
  catch (e) { /* best-effort */ }
}

// --- Mute Preference (localStorage) ---
function isMuted() {
  try { return localStorage.getItem('snakeMuted') === 'true'; }
  catch (e) { return false; }
}

function setMutePref(muted) {
  try { localStorage.setItem('snakeMuted', String(muted)); }
  catch (e) { /* best-effort; ignore storage errors */ }
}

// --- SFX Mute Preference (localStorage) ---
function isSfxMuted() {
  try { return localStorage.getItem('snakeSfxMuted') === 'true'; }
  catch (e) { return false; }
}

function setSfxMutePref(muted) {
  try { localStorage.setItem('snakeSfxMuted', String(muted)); }
  catch (e) { /* best-effort; ignore storage errors */ }
}

// --- Language Preference (localStorage) ---
function getLang() {
  try { return localStorage.getItem('snakeLang') || 'en'; }
  catch (e) { return 'pt'; }
}

function setLang(code) {
  try { localStorage.setItem('snakeLang', code); }
  catch (e) { /* best-effort */ }
}

// UI strings per language
const TRANSLATIONS = {
  pt: {
    score:          'Pontos',
    best:           'Melhor',
    controls:       'Use  ↑↓←→  ou  W A S D',
    play:           '🎮  JOGAR',
    playAgain:      '🎮 JOGAR NOVAMENTE',
    legendTitle:    'Legenda',
    won:            '🏆 VOCÊ VENCEU!',
    lost:           '💥 FIM DE JOGO!',
    scoreLabel:     'Pontuação',
    bestLabel:      '⭐ Melhor',
    newRecord:      '🏆 Novo Recorde!',
    enableSpecials: 'Ativar Especiais',
    disableSpecials:'Desativar Especiais',
    language:       'Idioma',
    food: {
      STANDARD: { name: 'Normal',    desc: 'Cresce 1 segmento e vale 1 ponto.' },
      PENTA:    { name: 'Penta',     desc: 'Cresce 5 segmentos e vale 5 pontos — raro!' },
      RUSH:     { name: 'Turbo',     desc: 'Corta 5 segmentos e acelera por 5 segundos.' },
      STAR:     { name: 'Estrela',   desc: 'Move-se sozinha. Vale 10 pontos. Não cresce.' },
      BOMB:     { name: 'Bomba',     desc: 'Vira 5 segmentos em obstáculos. Vale 10 pontos.' },
      OBSTACLE: { name: 'Obstáculo', desc: 'Criado pela Bomba. Colisão termina o jogo.' }
    }
  },
  en: {
    score:          'Score',
    best:           'Best',
    controls:       'Use  ↑↓←→  or  W A S D',
    play:           '🎮  PLAY',
    playAgain:      '🎮 PLAY AGAIN',
    legendTitle:    'Legend',
    won:            '🏆 YOU WIN!',
    lost:           '💥 GAME OVER!',
    scoreLabel:     'Score',
    bestLabel:      '⭐ Best',
    newRecord:      '🏆 New Record!',
    enableSpecials: 'Enable Specials',
    disableSpecials:'Disable Specials',
    language:       'Language',
    food: {
      STANDARD: { name: 'Normal',   desc: 'Grows 1 segment and scores 1 point.' },
      PENTA:    { name: 'Penta',    desc: 'Grows 5 segments and scores 5 points — rare!' },
      RUSH:     { name: 'Turbo',    desc: 'Cuts 5 segments and speeds up for 5 seconds.' },
      STAR:     { name: 'Star',     desc: 'Moves on its own. Scores 10 points. No growth.' },
      BOMB:     { name: 'Bomb',     desc: 'Turns 5 segments into obstacles. Scores 10 points.' },
      OBSTACLE: { name: 'Obstacle', desc: 'Created by Bomb. Collision ends the game.' }
    }
  },
  es: {
    score:          'Puntos',
    best:           'Mejor',
    controls:       'Usa  ↑↓←→  o  W A S D',
    play:           '🎮  JUGAR',
    playAgain:      '🎮 JUGAR DE NUEVO',
    legendTitle:    'Leyenda',
    won:            '🏆 ¡GANASTE!',
    lost:           '💥 ¡FIN DEL JUEGO!',
    scoreLabel:     'Puntuación',
    bestLabel:      '⭐ Mejor',
    newRecord:      '🏆 ¡Nuevo Récord!',
    enableSpecials: 'Activar Especiales',
    disableSpecials:'Desactivar Especiales',
    language:       'Idioma',
    food: {
      STANDARD: { name: 'Normal',    desc: 'Crece 1 segmento y vale 1 punto.' },
      PENTA:    { name: 'Penta',     desc: 'Crece 5 segmentos y vale 5 puntos — ¡raro!' },
      RUSH:     { name: 'Turbo',     desc: 'Corta 5 segmentos y acelera durante 5 segundos.' },
      STAR:     { name: 'Estrella',  desc: 'Se mueve sola. Vale 10 puntos. No crece.' },
      BOMB:     { name: 'Bomba',     desc: 'Convierte 5 segmentos en obstáculos. Vale 10 puntos.' },
      OBSTACLE: { name: 'Obstáculo', desc: 'Creado por Bomba. La colisión termina el juego.' }
    }
  },
  de: {
    score:          'Punkte',
    best:           'Beste',
    controls:       'Benutze  ↑↓←→  oder  W A S D',
    play:           '🎮  SPIELEN',
    playAgain:      '🎮 NOCHMAL SPIELEN',
    legendTitle:    'Legende',
    won:            '🏆 DU HAST GEWONNEN!',
    lost:           '💥 SPIEL VORBEI!',
    scoreLabel:     'Punkte',
    bestLabel:      '⭐ Beste',
    newRecord:      '🏆 Neuer Rekord!',
    enableSpecials: 'Spezials aktivieren',
    disableSpecials:'Spezials deaktivieren',
    language:       'Sprache',
    food: {
      STANDARD: { name: 'Normal',    desc: 'Wächst um 1 Segment und bringt 1 Punkt.' },
      PENTA:    { name: 'Penta',     desc: 'Wächst um 5 Segmente und bringt 5 Punkte — selten!' },
      RUSH:     { name: 'Turbo',     desc: 'Kürzt 5 Segmente und beschleunigt für 5 Sekunden.' },
      STAR:     { name: 'Stern',     desc: 'Bewegt sich allein. Bringt 10 Punkte. Kein Wachstum.' },
      BOMB:     { name: 'Bombe',     desc: 'Verwandelt 5 Segmente in Hindernisse. Bringt 10 Punkte.' },
      OBSTACLE: { name: 'Hindernis', desc: 'Von Bombe erstellt. Kollision beendet das Spiel.' }
    }
  },
  fr: {
    score:          'Points',
    best:           'Meilleur',
    controls:       'Utilise  ↑↓←→  ou  W A S D',
    play:           '🎮  JOUER',
    playAgain:      '🎮 REJOUER',
    legendTitle:    'Légende',
    won:            '🏆 TU AS GAGNÉ !',
    lost:           '💥 FIN DE JEU !',
    scoreLabel:     'Score',
    bestLabel:      '⭐ Meilleur',
    newRecord:      '🏆 Nouveau Record !',
    enableSpecials: 'Activer les spéciaux',
    disableSpecials:'Désactiver les spéciaux',
    language:       'Langue',
    food: {
      STANDARD: { name: 'Normal',    desc: 'Grandit de 1 segment et rapporte 1 point.' },
      PENTA:    { name: 'Penta',     desc: 'Grandit de 5 segments et rapporte 5 points — rare !' },
      RUSH:     { name: 'Turbo',     desc: 'Réduit de 5 segments et accélère pendant 5 secondes.' },
      STAR:     { name: 'Étoile',    desc: 'Se déplace seule. Rapporte 10 points. Pas de croissance.' },
      BOMB:     { name: 'Bombe',     desc: 'Transforme 5 segments en obstacles. Rapporte 10 points.' },
      OBSTACLE: { name: 'Obstacle',  desc: 'Créé par la Bombe. La collision termine le jeu.' }
    }
  },
  ru: {
    score:          'Очки',
    best:           'Рекорд',
    controls:       'Используй  ↑↓←→  или  W A S D',
    play:           '🎮  ИГРАТЬ',
    playAgain:      '🎮 ИГРАТЬ СНОВА',
    legendTitle:    'Легенда',
    won:            '🏆 ТЫ ПОБЕДИЛ!',
    lost:           '💥 ИГРА ОКОНЧЕНА!',
    scoreLabel:     'Очки',
    bestLabel:      '⭐ Рекорд',
    newRecord:      '🏆 Новый Рекорд!',
    enableSpecials: 'Включить спецеды',
    disableSpecials:'Выключить спецеды',
    language:       'Язык',
    food: {
      STANDARD: { name: 'Обычная',   desc: 'Растёт на 1 сегмент и даёт 1 очко.' },
      PENTA:    { name: 'Пента',     desc: 'Растёт на 5 сегментов и даёт 5 очков — редко!' },
      RUSH:     { name: 'Турбо',     desc: 'Срезает 5 сегментов и ускоряет на 5 секунд.' },
      STAR:     { name: 'Звезда',    desc: 'Движется сама. Даёт 10 очков. Не растёт.' },
      BOMB:     { name: 'Бомба',     desc: 'Превращает 5 сегментов в препятствия. Даёт 10 очков.' },
      OBSTACLE: { name: 'Препятствие', desc: 'Создано Бомбой. Столкновение завершает игру.' }
    }
  },
  ja: {
    score:          'スコア',
    best:           'ベスト',
    controls:       '↑↓←→  または  W A S D を使用',
    play:           '🎮  プレイ',
    playAgain:      '🎮 もう一度プレイ',
    legendTitle:    '凡例',
    won:            '🏆 あなたの勝ち！',
    lost:           '💥 ゲームオーバー！',
    scoreLabel:     'スコア',
    bestLabel:      '⭐ ベスト',
    newRecord:      '🏆 新記録！',
    enableSpecials: 'スペシャル有効',
    disableSpecials:'スペシャル無効',
    language:       '言語',
    food: {
      STANDARD: { name: '普通',       desc: '1セグメント成長、1ポイント獲得。' },
      PENTA:    { name: 'ペンタ',     desc: '5セグメント成長、5ポイント獲得 — レア！' },
      RUSH:     { name: 'ターボ',     desc: '5セグメント削減、5秒間加速。' },
      STAR:     { name: 'スター',     desc: '自動移動。10ポイント獲得。成長なし。' },
      BOMB:     { name: 'ボム',       desc: '5セグメントを障害物に変換。10ポイント獲得。' },
      OBSTACLE: { name: '障害物',     desc: 'ボムが作成。衝突でゲーム終了。' }
    }
  },
  zh: {
    score:          '分数',
    best:           '最高分',
    controls:       '使用  ↑↓←→  或  W A S D',
    play:           '🎮  开始游戏',
    playAgain:      '🎮 再玩一次',
    legendTitle:    '图例',
    won:            '🏆 你赢了！',
    lost:           '💥 游戏结束！',
    scoreLabel:     '分数',
    bestLabel:      '⭐ 最高分',
    newRecord:      '🏆 新纪录！',
    enableSpecials: '启用特殊食物',
    disableSpecials:'禁用特殊食物',
    language:       '语言',
    food: {
      STANDARD: { name: '普通',   desc: '增长1节，得1分。' },
      PENTA:    { name: '五倍',   desc: '增长5节，得5分——稀有！' },
      RUSH:     { name: '涡轮',   desc: '减少5节并加速5秒。' },
      STAR:     { name: '星星',   desc: '自动移动。得10分。不增长。' },
      BOMB:     { name: '炸弹',   desc: '将5节变为障碍物。得10分。' },
      OBSTACLE: { name: '障碍物', desc: '由炸弹创建。碰撞结束游戏。' }
    }
  },
  hi: {
    score:          'अंक',
    best:           'सर्वश्रेष्ठ',
    controls:       '↑↓←→  या  W A S D उपयोग करें',
    play:           '🎮  खेलें',
    playAgain:      '🎮 फिर खेलें',
    legendTitle:    'विवरण',
    won:            '🏆 आप जीत गए!',
    lost:           '💥 खेल समाप्त!',
    scoreLabel:     'अंक',
    bestLabel:      '⭐ सर्वश्रेष्ठ',
    newRecord:      '🏆 नया रिकॉर्ड!',
    enableSpecials: 'विशेष सक्षम करें',
    disableSpecials:'विशेष अक्षम करें',
    language:       'भाषा',
    food: {
      STANDARD: { name: 'सामान्य',  desc: '1 खंड बढ़ता है और 1 अंक मिलता है।' },
      PENTA:    { name: 'पेंटा',    desc: '5 खंड बढ़ते हैं और 5 अंक मिलते हैं — दुर्लभ!' },
      RUSH:     { name: 'टर्बो',    desc: '5 खंड घटाता है और 5 सेकंड के लिए तेज़ करता है।' },
      STAR:     { name: 'तारा',     desc: 'खुद चलता है। 10 अंक मिलते हैं। बढ़ता नहीं।' },
      BOMB:     { name: 'बम',       desc: '5 खंडों को अवरोध में बदलता है। 10 अंक मिलते हैं।' },
      OBSTACLE: { name: 'अवरोध',   desc: 'बम द्वारा बनाया गया। टकराने से खेल समाप्त।' }
    }
  },
  ar: {
    score:          'النقاط',
    best:           'أفضل',
    controls:       'استخدم  ↑↓←→  أو  W A S D',
    play:           '🎮  العب',
    playAgain:      '🎮 العب مجدداً',
    legendTitle:    'الدليل',
    won:            '🏆 لقد فزت!',
    lost:           '💥 انتهت اللعبة!',
    scoreLabel:     'النقاط',
    bestLabel:      '⭐ أفضل',
    newRecord:      '🏆 رقم قياسي جديد!',
    enableSpecials: 'تفعيل الخاصة',
    disableSpecials:'تعطيل الخاصة',
    language:       'اللغة',
    food: {
      STANDARD: { name: 'عادي',     desc: 'ينمو قطعة واحدة ويمنح نقطة واحدة.' },
      PENTA:    { name: 'بنتا',     desc: 'ينمو 5 قطع ويمنح 5 نقاط — نادر!' },
      RUSH:     { name: 'توربو',    desc: 'يقلص 5 قطع ويسرّع لمدة 5 ثوانٍ.' },
      STAR:     { name: 'نجمة',     desc: 'تتحرك وحدها. تمنح 10 نقاط. لا نمو.' },
      BOMB:     { name: 'قنبلة',    desc: 'تحوّل 5 قطع إلى عوائق. تمنح 10 نقاط.' },
      OBSTACLE: { name: 'عائق',     desc: 'أُنشئ بالقنبلة. الاصطدام ينهي اللعبة.' }
    }
  }
};

// Returns the translated string for a top-level key in the current language.
function t(key) {
  const lang = TRANSLATIONS[getLang()] ?? TRANSLATIONS.en;
  return lang[key] ?? TRANSLATIONS.en[key] ?? key;
}

// Server-integration seam: swap this function to use a real server response.
// telemetry: TelemetryRecord[] — last ≤10 consumed cards (currently unused locally).
function fetchNextCard(telemetry) {
  if (!isSpecialFoodsEnabled()) return { slots: [FOOD_TYPES.STANDARD] };

  // Pick card size via CARD_SIZE_WEIGHTS cumulative wheel
  const sizeTotal = CARD_SIZE_WEIGHTS.reduce((a, b) => a + b.w, 0);
  let sizeRoll = Math.random() * sizeTotal;
  let cardSize = 1;
  for (const entry of CARD_SIZE_WEIGHTS) {
    sizeRoll -= entry.w;
    if (sizeRoll <= 0) { cardSize = entry.size; break; }
  }

  const slots = [];
  let pentaCount = 0;
  let bombCount  = 0;

  for (let i = 0; i < cardSize; i++) {
    let type;
    do {
      type = _weightedPick(RARITY_WEIGHTS);
      if (type === FOOD_TYPES.PENTA && pentaCount >= 1) continue;
      if (type === FOOD_TYPES.BOMB  && bombCount  >= 1) continue;
      break;
    } while (true);

    if (type === FOOD_TYPES.PENTA) pentaCount++;
    if (type === FOOD_TYPES.BOMB)  bombCount++;
    slots.push(type);
  }

  return { slots };
}

// ============================================================
// EVENT CARD MANAGER (T007–T014)
// ============================================================
class EventCardManager {
  constructor(scene) {
    this.scene      = scene;
    this.queue      = [];
    this.activeCard = null;
    this.telemetry  = [];
  }

  // Return all grid cells not occupied by snake, obstacles, or existing foods.
  getFreeCells() {
    const state = this.scene.state;
    const free  = [];
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        const occupied =
          state.snake.some(s => s.x === x && s.y === y) ||
          state.obstacles.some(o => o.x === x && o.y === y) ||
          state.foods.some(f => f.x === x && f.y === y);
        if (!occupied) free.push({ x, y });
      }
    }
    return free;
  }

  // Append one new card to the end of the queue.
  appendNewCard() {
    this.queue.push(fetchNextCard(this.telemetry));
  }

  // Record telemetry for the just-completed active card.
  recordTelemetry() {
    this.telemetry.push({
      cardSlots:     [...this.activeCard.slots],
      timeToConsume: parseFloat(((Date.now() - this.activeCard.drawnAt) / 1000).toFixed(2)),
      snakeLength:   this.scene.state.snake.length,
      score:         this.scene.state.score
    });
    if (this.telemetry.length > 10) this.telemetry.shift();
  }

  // Pop the front card, place its foods, set activeCard, replenish queue.
  activateCard() {
    const cardDef = this.queue.shift();
    if (!cardDef) return;

    const free  = this.getFreeCells();
    let placed  = 0;

    for (const slot of cardDef.slots) {
      if (free.length === 0) break;
      const idx  = Phaser.Math.Between(0, free.length - 1);
      const cell = free.splice(idx, 1)[0];
      const food = {
        type: slot, x: cell.x, y: cell.y,
        starDir: null, starTimer: null, gen: 0, visible: true
      };
      this.scene.state.foods.push(food);
      if (slot === FOOD_TYPES.STAR) this.scene.createStarTimer(food);
      placed++;
    }

    this.activeCard = { slots: [...cardDef.slots], remaining: placed, drawnAt: Date.now() };
    this.appendNewCard();
    this.scene.updateCardStrip();
    this.scene.redraw();
  }

  // Called each time the snake consumes a food from the active card.
  onFoodConsumed(food) {
    if (!this.activeCard) return;
    this.activeCard.remaining--;
    this.scene.updateCardStrip();
    if (this.activeCard.remaining <= 0) {
      this.recordTelemetry();
      this.activateCard();
    }
  }

  // Pre-fill the queue (10 cards) then activate the first one.
  init() {
    for (let i = 0; i < 10; i++) this.appendNewCard();
    this.activateCard();
  }

  // Cancel all STAR timers and clean up.
  destroy() {
    for (const food of this.scene.state.foods) {
      if (food.starTimer) { food.starTimer.remove(true); food.starTimer = null; }
    }
    this.activeCard = null;
  }
}

// ============================================================
// GAME SCENE
// ============================================================
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  // T002 — load audio assets
  preload() {
    this.load.audio('bgm',              'audio/bgm.mp3');
    this.load.audio('sfx_eat_standard', ['audio/sfx_eat_standard.ogg', 'audio/sfx_eat_standard.mp3']);
    this.load.audio('sfx_eat_penta',    ['audio/sfx_eat_penta.ogg',    'audio/sfx_eat_penta.mp3']);
    this.load.audio('sfx_eat_rush',     ['audio/sfx_eat_rush.ogg',     'audio/sfx_eat_rush.mp3']);
    this.load.audio('sfx_eat_star',     ['audio/sfx_eat_star.ogg',     'audio/sfx_eat_star.mp3']);
    this.load.audio('sfx_eat_bomb',     ['audio/sfx_eat_bomb.ogg',     'audio/sfx_eat_bomb.mp3']);
    this.load.audio('sfx_collision',    ['audio/sfx_collision.ogg',    'audio/sfx_collision.mp3']);
  }

  // T025 — scene setup
  create(data) {
    this.state = {
      snake:           [
        { x: Math.floor(COLS / 2) + 2, y: Math.floor(ROWS / 2) },
        { x: Math.floor(COLS / 2) + 1, y: Math.floor(ROWS / 2) },
        { x: Math.floor(COLS / 2),     y: Math.floor(ROWS / 2) }
      ],
      dir:             DIRS.RIGHT,
      nextDir:         DIRS.RIGHT,
      foods:           [],
      obstacles:       [],
      score:           0,
      personalBest:    data?.personalBest ?? getPersonalBest(),
      growthRemaining: 0,
      baseDelay:       TICK_BASE,
      tickDelay:       TICK_BASE,
      tickRef:         null,
      tickGen:         0,
      rushActive:      false,
      rushTimerRef:    null,
      rushStackCount:  0
    };

    this.gfx     = this.add.graphics();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys('W,A,S,D');

    this.scoreTxt = this.add.text(12, HUD_H / 2, t('score') + ': 0', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '22px',
      fontStyle:  'bold',
      color:      '#ffffff'
    }).setOrigin(0, 0.5);

    this.bestTxt = this.add.text(CANVAS_W - 100, HUD_H / 2, t('best') + ': 0', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '22px',
      fontStyle:  'bold',
      color:      '#ffeb3b'
    }).setOrigin(1, 0.5);

    // BGM toggle button
    // Note: this.music is assigned later in create(); clicking before assignment is impossible
    // because Phaser pointer events only fire after create() returns.
    const bgmBtn = this.add.text(CANVAS_W - 76, HUD_H / 2, isMuted() ? '🔇' : '🔊', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '22px',
      color:      '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => bgmBtn.setScale(1.15))
      .on('pointerout',  () => bgmBtn.setScale(1.0))
      .on('pointerdown', () => {
        bgmBtn.setScale(0.9);
        const nowMuted = !isMuted();
        setMutePref(nowMuted);
        this.music.setMute(nowMuted);
        bgmBtn.setText(nowMuted ? '🔇' : '🔊');
      })
      .on('pointerup', () => bgmBtn.setScale(1.0));

    // SFX toggle button
    const sfxBtn = this.add.text(CANVAS_W - 36, HUD_H / 2, isSfxMuted() ? '🔕' : '🔔', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '22px',
      color:      '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => sfxBtn.setScale(1.15))
      .on('pointerout',  () => sfxBtn.setScale(1.0))
      .on('pointerdown', () => {
        sfxBtn.setScale(0.9);
        const nowSfxMuted = !isSfxMuted();
        setSfxMutePref(nowSfxMuted);
        sfxBtn.setText(nowSfxMuted ? '🔕' : '🔔');
      })
      .on('pointerup', () => sfxBtn.setScale(1.0));

    this.cardStripGfx   = this.add.graphics();
    this.cardStripTexts = [];

    this.cardManager = new EventCardManager(this);
    this.cardManager.init();  // places first card's foods, calls redraw + updateCardStrip

    this.updateHUD();

    // T004 — init background music
    this.music = this.sound.add('bgm', { loop: true, volume: 0.5 });
    // Persistence: isMuted() and isSfxMuted() are read from localStorage on every create() call,
    // so both BGM and SFX preferences survive page reload automatically — no extra code needed.
    this.music.setMute(isMuted());
    this.musicStarted = false;

    // T005 — handle browser autoplay policy: play on first audio unlock
    this.sound.once('unlocked', () => {
      if (!this.musicStarted && !isMuted()) {
        this.music.play();
        this.musicStarted = true;
      }
    });
    // If AudioContext is already running (page reloaded after prior interaction), play immediately
    if (this.sound.context && this.sound.context.state === 'running' && !this.musicStarted) {
      this.music.play();
      this.musicStarted = true;
    }

    this.restartTick(TICK_BASE);

    // Mobile swipe controls
    this._swipeStart = null;
    this.input.on('pointerdown', (p) => {
      this._swipeStart = { x: p.x, y: p.y };
    });
    this.input.on('pointerup', (p) => {
      if (!this._swipeStart) return;
      const dx    = p.x - this._swipeStart.x;
      const dy    = p.y - this._swipeStart.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      this._swipeStart = null;
      if (Math.max(absDx, absDy) < 30) return; // too short — ignore
      const dir = absDx > absDy
        ? (dx > 0 ? DIRS.RIGHT : DIRS.LEFT)
        : (dy > 0 ? DIRS.DOWN  : DIRS.UP);
      if (dir !== OPPOSITES.get(this.state.dir)) this.state.nextDir = dir;
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

  // T026 — core game-loop tick
  tick() {
    // T006 — start BGM on first game tick (covers Edge/Firefox autoplay edge cases)
    if (!this.musicStarted && !isMuted()) {
      this.music.play();
      this.musicStarted = true;
    }

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

    // Obstacle collision (FOOD-BOMB tiles)
    if (state.obstacles.some(o => o.x === newHead.x && o.y === newHead.y)) {
      this.gameOver();
      return;
    }

    // Self collision
    if (state.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      this.gameOver();
      return;
    }

    // Food collision — reverse loop so splicing doesn't skip items
    for (let i = state.foods.length - 1; i >= 0; i--) {
      const f = state.foods[i];
      if (f.x === newHead.x && f.y === newHead.y) {
        if (f.starTimer) { f.starTimer.remove(true); f.starTimer = null; }
        state.foods.splice(i, 1);
        this.applyFoodEffect(f);
        this.cardManager.onFoodConsumed(f);
        break;
      }
    }

    // Growth / tail pop
    if (state.growthRemaining > 0) {
      state.growthRemaining--;
    } else {
      state.snake.pop();
    }
    state.snake.unshift(newHead);

    // Win check
    if (state.snake.length === COLS * ROWS) {
      this.gameWon();
      return;
    }

    this.redraw();
  }

  // T032 — render grid, obstacles, foods, and snake
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

    // Obstacles (FOOD-BOMB tiles)
    state.obstacles.forEach(obs => drawObstacle(gfx, obs));

    // Foods (all types via drawFoodShape)
    state.foods.forEach(food => {
      const cx = food.x * CELL + CELL / 2;
      const cy = HUD_H + food.y * CELL + CELL / 2;
      drawFoodShape(gfx, food, cx, cy);
    });

    // Snake body (all segments except head)
    const _bPad = Math.max(1, Math.round(CELL * 0.08));
    const _bR   = Math.max(1, Math.round(CELL * 0.14));
    const _hPad = Math.max(1, Math.round(CELL * 0.04));
    const _hR   = Math.max(1, Math.round(CELL * 0.20));
    if (state.rushActive) {
      const pulse = 0.7 + 0.3 * Math.abs(Math.sin(this.time.now / 160));
      gfx.fillStyle(0xaa00ff, pulse);
      for (let i = 1; i < state.snake.length; i++) {
        const s = state.snake[i];
        gfx.fillRoundedRect(s.x * CELL + _bPad, HUD_H + s.y * CELL + _bPad, CELL - _bPad * 2, CELL - _bPad * 2, _bR);
      }
      // Snake head (rushed)
      const head = state.snake[0];
      gfx.fillStyle(0xcc44ff, 1);
      gfx.fillRoundedRect(head.x * CELL + _hPad, HUD_H + head.y * CELL + _hPad, CELL - _hPad * 2, CELL - _hPad * 2, _hR);
    } else {
      gfx.fillStyle(C_SNAKE_BODY, 1);
      for (let i = 1; i < state.snake.length; i++) {
        const s = state.snake[i];
        gfx.fillRoundedRect(s.x * CELL + _bPad, HUD_H + s.y * CELL + _bPad, CELL - _bPad * 2, CELL - _bPad * 2, _bR);
      }
      // Snake head (normal)
      const head = state.snake[0];
      gfx.fillStyle(C_SNAKE_HEAD, 1);
      gfx.fillRoundedRect(head.x * CELL + _hPad, HUD_H + head.y * CELL + _hPad, CELL - _hPad * 2, CELL - _hPad * 2, _hR);
    }
  }

  // T015 — restart the tick timer at a new delay, incrementing tickGen
  restartTick(delay) {
    this.state.tickGen++;
    if (this.state.tickRef) this.state.tickRef.remove(false);
    this.state.tickDelay = delay;
    this.state.tickRef = this.time.addEvent({
      delay, callback: this.tick, callbackScope: this, loop: true
    });
  }

  // T027 — score-based speed increase; updates baseDelay; refreshes STAR timers (A1 fix)
  updateSpeed() {
    const state = this.state;
    if (state.score > 0 && state.score % SCORE_PER_SPEEDUP === 0) {
      const newBase = Math.max(TICK_MIN, state.baseDelay - TICK_STEP);
      if (newBase !== state.baseDelay) {
        state.baseDelay = newBase;
        if (!state.rushActive) {
          this.restartTick(newBase);
          // Refresh STAR timers so they track the new speed
          state.foods.filter(f => f.type === FOOD_TYPES.STAR).forEach(f => {
            if (f.starTimer) f.starTimer.remove(true);
            this.createStarTimer(f);
          });
        }
      }
    }
  }

  // T017 — refresh HUD score & personal best texts
  updateHUD() {
    this.scoreTxt.setText(t('score') + ': ' + this.state.score);
    this.bestTxt.setText(t('best') + ': ' + this.state.personalBest);
  }

  // ── Growth & shrink ─────────────────────────────────────────

  // T016 — queue additional growth segments
  growSnake(n) {
    this.state.growthRemaining += n;
  }

  // T017 — remove up to n tail segments (never removes the head)
  shrinkSnake(n) {
    const remove = Math.min(n, this.state.snake.length - 1);
    if (remove > 0) {
      const removed = this.state.snake.splice(this.state.snake.length - remove, remove);
      this.spawnGhosts(removed);
    }
  }

  // 007 — spawn fading ghost rectangles at positions of removed segments
  spawnGhosts(segments) {
    const gp = Math.max(1, Math.round(CELL * 0.08));
    for (const { x, y } of segments) {
      const rect = this.add.rectangle(
        x * CELL + CELL / 2,
        HUD_H + y * CELL + CELL / 2,
        CELL - gp * 2,
        CELL - gp * 2,
        C_SNAKE_BODY
      );
      rect.setDepth(1);
      this.tweens.add({
        targets:    rect,
        alpha:      0,
        duration:   500,
        ease:       'Sine.Out',
        onComplete: () => rect.destroy()
      });
    }
  }

  // ── Food effects ────────────────────────────────────────────

  // T018 — last 5 tail segments become permanent obstacle tiles; score +10
  bombEffect() {
    const state  = this.state;
    const remove = Math.min(5, state.snake.length - 1);
    const tail   = state.snake.splice(state.snake.length - remove, remove);
    for (const seg of tail) {
      // If another food is sitting on the new obstacle cell, displace it (B1 fix)
      const fi = state.foods.findIndex(f => f.x === seg.x && f.y === seg.y);
      if (fi !== -1) {
        const displaced = state.foods.splice(fi, 1)[0];
        if (displaced.starTimer) { displaced.starTimer.remove(true); displaced.starTimer = null; }
      }
      state.obstacles.push({ x: seg.x, y: seg.y });
    }
    state.score += 10;
    // updateHUD() is called by applyFoodEffect() after this returns
  }

  // T020 — boost tick rate 1.5× per stack for 5 s; stacks on re-eat, timer resets
  activateRush() {
    const state = this.state;
    state.rushStackCount++;
    const boosted = Math.max(TICK_MIN, Math.floor(state.baseDelay / Math.pow(RUSH_SPEED_FACTOR, state.rushStackCount)));
    this.restartTick(boosted);
    if (state.rushTimerRef) state.rushTimerRef.remove(false);
    state.rushActive   = true;
    state.rushTimerRef = this.time.delayedCall(RUSH_BOOST_DURATION, this.rushExpired, [], this);
  }

  // T019 — restore score-adjusted base delay after boost expires; refresh STAR timers (A1 fix)
  rushExpired() {
    const state = this.state;
    state.rushActive    = false;
    state.rushTimerRef  = null;
    state.rushStackCount = 0;
    this.restartTick(state.baseDelay);
    state.foods.filter(f => f.type === FOOD_TYPES.STAR).forEach(f => {
      if (f.starTimer) f.starTimer.remove(true);
      this.createStarTimer(f);
    });
  }

  // T021 — dispatch per-type effect then update HUD + speed
  applyFoodEffect(food) {
    const state = this.state;
    switch (food.type) {
      case FOOD_TYPES.STANDARD: state.growthRemaining++; state.score++;    if (!isSfxMuted()) this.sound.play('sfx_eat_standard', { volume: 0.7 }); break;
      case FOOD_TYPES.PENTA:    this.growSnake(5);       state.score += 5; if (!isSfxMuted()) this.sound.play('sfx_eat_penta',    { volume: 0.8 }); break;
      case FOOD_TYPES.RUSH:     this.shrinkSnake(5);  this.activateRush();  if (!isSfxMuted()) this.sound.play('sfx_eat_rush',     { volume: 0.8 }); break;
      case FOOD_TYPES.STAR:     state.score += 10;                          if (!isSfxMuted()) this.sound.play('sfx_eat_star',     { volume: 0.8 }); break;
      case FOOD_TYPES.BOMB:     this.bombEffect();                          if (!isSfxMuted()) this.sound.play('sfx_eat_bomb',     { volume: 0.9 }); break;
    }
    this.updateHUD();
    this.updateSpeed();
  }

  // ── FOOD-STAR autonomous movement ───────────────────────────

  // T022 — cancel every active STAR timer (called on game-over/win/destroy)
  cancelAllStarTimers() {
    for (const food of this.state.foods) {
      if (food.starTimer) { food.starTimer.remove(true); food.starTimer = null; }
    }
  }

  // T024 — create a looping timer driving STAR movement at 2× the snake's tick delay
  createStarTimer(food) {
    const dirs   = Object.values(DIRS);
    food.gen     = this.state.tickGen;
    food.starDir = dirs[Math.floor(Math.random() * dirs.length)];
    food.visible = true;
    food.starTimer = this.time.addEvent({
      delay:    this.state.baseDelay * STAR_SPEED_FACTOR,
      callback: () => this.moveStar(food, food.gen),
      loop:     true
    });
  }

  // T023 — move STAR one cell; blink toggle; teleport if all directions blocked
  moveStar(food, capturedGen) {
    if (capturedGen !== this.state.tickGen) return;  // stale gen-guard
    const state = this.state;

    // Blink toggle (T034)
    food.visible = !food.visible;

    // Candidate directions: current first, then 3 others shuffled
    const others = Object.values(DIRS).filter(d => d !== food.starDir);
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    const candidates = [food.starDir, ...others];

    for (const dir of candidates) {
      const nx = food.x + dir.x;
      const ny = food.y + dir.y;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (state.snake.some(s => s.x === nx && s.y === ny))     continue;
      if (state.obstacles.some(o => o.x === nx && o.y === ny)) continue;
      if (state.foods.some(f => f !== food && f.x === nx && f.y === ny)) continue;
      food.starDir = dir;
      food.x = nx;
      food.y = ny;
      this.redraw();
      return;
    }

    // All 4 directions blocked → teleport to a random free cell
    const free = this.cardManager.getFreeCells();
    if (free.length > 0) {
      const cell = free[Math.floor(Math.random() * free.length)];
      food.x = cell.x;
      food.y = cell.y;
    }
    this.redraw();
  }

  // ── Card strip HUD ──────────────────────────────────────────

  // T028 — redraw the 32 px strip below the grid showing remaining foods
  updateCardStrip() {
    this.cardStripGfx.clear();
    this.cardStripTexts.forEach(t => t.destroy());
    this.cardStripTexts = [];

    const stripY = HUD_H + ROWS * CELL;

    // Background
    this.cardStripGfx.fillStyle(C_HUD_BG, 1);
    this.cardStripGfx.fillRect(0, stripY, CANVAS_W, CARD_STRIP_H);

    if (!this.cardManager || !this.cardManager.activeCard) return;

    // Count remaining foods by type from live state.foods (A2 fix: NOT from activeCard.slots)
    const counts = new Map();
    for (const food of this.state.foods) {
      counts.set(food.type, (counts.get(food.type) || 0) + 1);
    }
    if (counts.size === 0) return;

    let x = 8;
    const textY = stripY + CARD_STRIP_H / 2;

    for (const [type, count] of counts) {
      // Mini colored square icon (12×12)
      this.cardStripGfx.fillStyle(FOOD_COLORS[type], 1);
      this.cardStripGfx.fillRect(x, stripY + 4, 12, 12);

      // Count label — 18 px minimum (C1 fix: was 14 px, violates constitution Principle III)
      const txt = this.add.text(x + 16, textY, '\u00D7' + count, {
        fontFamily: 'Arial',
        fontSize:   '18px',
        color:      '#ffffff'
      }).setOrigin(0, 0.5);
      this.cardStripTexts.push(txt);

      x += 48;
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────

  // Shared cleanup for both gameOver and gameWon (T029/T030)
  _cleanupRound() {
    this.cancelAllStarTimers();
    const state = this.state;
    if (state.rushTimerRef) { state.rushTimerRef.remove(false); state.rushTimerRef = null; }
    if (this.cardManager)   { this.cardManager.destroy(); this.cardManager = null; }
    this.cardStripTexts.forEach(t => t.destroy());
    this.cardStripTexts = [];
    this.cardStripGfx.clear();
    // T007 — stop background music when round ends
    if (this.music && this.music.isPlaying) { this.music.stop(); this.musicStarted = false; }
  }

  // T029 — game over: cleanup timers/managers, red flash, transition
  gameOver() {
    // T015 — collision sound effect (respects SFX mute preference)
    if (!isSfxMuted()) this.sound.play('sfx_collision', { volume: 1.0 });
    this.state.tickRef.remove(false);
    this._cleanupRound();
    const overlay = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0xff0000, 0);
    this.tweens.add({
      targets:  overlay,
      alpha:    0.4,
      duration: 350,
      yoyo:     true
    });
    this.time.delayedCall(850, () => {
      const newBest = Math.max(this.state.score, this.state.personalBest);
      savePersonalBest(newBest);
      this.scene.start('GameOverScene', {
        score:        this.state.score,
        personalBest: newBest,
        won:          false
      });
    });
  }

  // T030 — win: cleanup timers/managers, gold flash, transition
  gameWon() {
    this.state.tickRef.remove(false);
    this._cleanupRound();
    const overlay = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0xffd700, 0);
    this.tweens.add({
      targets:  overlay,
      alpha:    0.4,
      duration: 350,
      yoyo:     true
    });
    this.time.delayedCall(850, () => {
      const newBest = Math.max(this.state.score, this.state.personalBest);
      savePersonalBest(newBest);
      this.scene.start('GameOverScene', {
        score:        this.state.score,
        personalBest: newBest,
        won:          true
      });
    });
  }
}

// ============================================================
// GAME OVER SCENE
// ============================================================
class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data) {
    // Dark overlay
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.82);

    // Title
    const titleText  = data.won ? t('won') : t('lost');
    const titleColor = data.won ? '#ffd700' : '#ff5252';
    this.add.text(CANVAS_W / 2, CANVAS_H * 0.28, titleText, {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '48px',
      fontStyle:  'bold',
      color:      titleColor
    }).setOrigin(0.5);

    // Final score
    this.add.text(CANVAS_W / 2, CANVAS_H * 0.45, t('scoreLabel') + ': ' + data.score, {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '32px',
      fontStyle:  'bold',
      color:      '#ffffff'
    }).setOrigin(0.5);

    // T019 — personal best
    this.add.text(CANVAS_W / 2, CANVAS_H * 0.54, t('bestLabel') + ': ' + data.personalBest, {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '26px',
      fontStyle:  'bold',
      color:      '#ffeb3b'
    }).setOrigin(0.5);

    if (data.score > 0 && data.score >= data.personalBest) {
      const rec = this.add.text(CANVAS_W / 2, CANVAS_H * 0.63, t('newRecord'), {
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
      t('playAgain'), 0x00c853, '#ffffff', 260, 64
    );

    // Guard against double-trigger from button + keyboard
    let going = false;
    const restart = () => {
      if (going) return;
      going = true;
      this.scene.start('LegendScene', { personalBest: data.personalBest });  // T018 — show legend before restarting
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
    this.personalBest = data?.personalBest ?? getPersonalBest();

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
    this.add.text(CANVAS_W / 2, CANVAS_H * 0.42, t('controls'), {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '20px',
      color:      '#cccccc'
    }).setOrigin(0.5);

    // T021 — JOGAR button
    const btn = makeButton(
      this, CANVAS_W / 2, CANVAS_H * 0.58,
      t('play'), 0x00c853, '#ffffff', 220, 64
    );

    // Guard against double-trigger
    let going = false;
    const startGame = () => {
      if (going) return;
      going = true;
      this.scene.start('LegendScene', { personalBest: this.personalBest });
    };

    btn.gfx.on('pointerup', startGame);

    // T022 — keyboard shortcuts
    this.input.keyboard.on('keydown-SPACE', startGame);
    this.input.keyboard.on('keydown-ENTER', startGame);

    // T023 — personal best display (only when > 0)
    if (this.personalBest > 0) {
      this.add.text(CANVAS_W / 2, CANVAS_H * 0.75, t('bestLabel') + ': ' + this.personalBest, {
        fontFamily: '"Trebuchet MS", Arial',
        fontSize:   '22px',
        fontStyle:  'bold',
        color:      '#ffeb3b'
      }).setOrigin(0.5);
    }
  }
}

// ============================================================
// FEATURE 003 — LEGEND SCREEN
// ============================================================
class LegendScene extends Phaser.Scene {
  constructor() {
    super('LegendScene');
  }

  create(data) {
    this.personalBest = data?.personalBest ?? getPersonalBest();

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(C_BG, 1);
    bg.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Title
    this.add.text(20, 32, t('legendTitle'), {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '28px',
      fontStyle:  'bold',
      color:      '#00e676'
    }).setOrigin(0, 0.5);

    // BGM toggle button (top-right, same row as title)
    // NOTE: works because scene.start() stops GameScene; update to call music API if scene.launch() is ever used.
    const lgBgmBtn = this.add.text(CANVAS_W - 76, 32, isMuted() ? '🔇' : '🔊', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '22px',
      color:      '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => lgBgmBtn.setScale(1.15))
      .on('pointerout',  () => lgBgmBtn.setScale(1.0))
      .on('pointerdown', () => {
        lgBgmBtn.setScale(0.9);
        const nowMuted = !isMuted();
        setMutePref(nowMuted);
        lgBgmBtn.setText(nowMuted ? '🔇' : '🔊');
      })
      .on('pointerup', () => lgBgmBtn.setScale(1.0));

    // SFX toggle button (top-right, same row as title)
    const lgSfxBtn = this.add.text(CANVAS_W - 36, 32, isSfxMuted() ? '🔕' : '🔔', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '22px',
      color:      '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => lgSfxBtn.setScale(1.15))
      .on('pointerout',  () => lgSfxBtn.setScale(1.0))
      .on('pointerdown', () => {
        lgSfxBtn.setScale(0.9);
        const nowSfxMuted = !isSfxMuted();
        setSfxMutePref(nowSfxMuted);
        lgSfxBtn.setText(nowSfxMuted ? '🔕' : '🔔');
      })
      .on('pointerup', () => lgSfxBtn.setScale(1.0));

    // Entry definitions (translated)
    const foodTr = (TRANSLATIONS[getLang()] ?? TRANSLATIONS.pt).food;
    const entries = [
      { type: 'STANDARD', nome: foodTr.STANDARD.name, desc: foodTr.STANDARD.desc },
      { type: 'PENTA',    nome: foodTr.PENTA.name,    desc: foodTr.PENTA.desc    },
      { type: 'RUSH',     nome: foodTr.RUSH.name,      desc: foodTr.RUSH.desc     },
      { type: 'STAR',     nome: foodTr.STAR.name,      desc: foodTr.STAR.desc     },
      { type: 'BOMB',     nome: foodTr.BOMB.name,      desc: foodTr.BOMB.desc     },
      { type: 'OBSTACLE', nome: foodTr.OBSTACLE.name,  desc: foodTr.OBSTACLE.desc }
    ];

    const sepGfx = this.add.graphics();  // separators always full opacity
    const ROW_H   = Math.floor((CANVAS_H - 200) / entries.length);
    const Y_START = 58;
    const specialEnabled = isSpecialFoodsEnabled();

    entries.forEach((entry, i) => {
      const rowTop = Y_START + i * ROW_H;
      const cx     = 40;
      const cy     = rowTop + 32;

      // Per-row icon graphics (allows per-row alpha)
      const iconGfx = this.add.graphics();

      // Icon
      if (entry.type === 'OBSTACLE') {
        iconGfx.fillStyle(C_OBSTACLE, 1);
        iconGfx.fillRect(cx - 14, cy - 14, 28, 28);
        iconGfx.lineStyle(2, 0x263238, 1);
        iconGfx.lineBetween(cx - 10, cy - 10, cx + 10, cy + 10);
        iconGfx.lineBetween(cx + 10, cy - 10, cx - 10, cy + 10);
      } else {
        drawFoodShape(iconGfx, { type: entry.type, visible: true }, cx, cy);
      }

      // Name
      const nameText = this.add.text(72, rowTop + 8, entry.nome, {
        fontFamily: '"Trebuchet MS", Arial',
        fontSize:   '22px',
        fontStyle:  'bold',
        color:      '#ffffff'
      });

      // Description
      const descText = this.add.text(72, rowTop + 34, entry.desc, {
        fontFamily: '"Trebuchet MS", Arial',
        fontSize:   '18px',
        color:      '#cccccc'
      });

      // Separator (skip after last row)
      if (i < entries.length - 1) {
        sepGfx.lineStyle(1, 0x263238, 0.5);
        sepGfx.lineBetween(0, rowTop + ROW_H - 1, CANVAS_W, rowTop + ROW_H - 1);
      }

      // Dim non-STANDARD entries (including OBSTACLE) when special foods are disabled
      if (!specialEnabled && entry.type !== 'STANDARD') {
        iconGfx.setAlpha(0.35);
        nameText.setAlpha(0.35);
        descText.setAlpha(0.35);
      }
    });

    // Toggle button — disable / re-enable special foods
    const toggleLabel = specialEnabled ? t('disableSpecials') : t('enableSpecials');
    const toggleColor = specialEnabled ? 0x757575 : 0x43a047;
    const toggleBtn = makeButton(this, CANVAS_W / 2, Y_START + entries.length * ROW_H + 30, toggleLabel, toggleColor, '#ffffff', Math.min(280, CANVAS_W - 40), 52);
    toggleBtn.gfx.on('pointerup', () => {
      setSpecialFoodsEnabled(!specialEnabled);
      this.scene.restart();
    });

    // Language selector — top-right, left of audio buttons
    const _curLang = getLang();
    const _langOpts = [
      { code: 'pt', label: 'Português' },
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
      { code: 'de', label: 'Deutsch' },
      { code: 'fr', label: 'Français' },
      { code: 'ru', label: 'Русский' },
      { code: 'ja', label: '日本語' },
      { code: 'zh', label: '中文' },
      { code: 'hi', label: 'हिन्दी' },
      { code: 'ar', label: 'العربية' }
    ].map(l => `<option value="${l.code}"${l.code === _curLang ? ' selected' : ''}>${l.label}</option>`).join('');

    const _langSel = this.add.dom(CANVAS_W - 165, 32).createFromHTML(
      `<select style="background:#0f3460;color:#fff;border:1px solid #00e676;border-radius:6px;padding:2px 6px;font-size:13px;font-family:'Trebuchet MS',Arial,sans-serif;cursor:pointer;outline:none;min-width:110px;">${_langOpts}</select>`
    );
    _langSel.addListener('change');
    _langSel.on('change', (evt) => {
      setLang(evt.target.value);
      this.scene.restart();
    });

    // Jogar button — starts the game
    const playBtn = makeButton(this, CANVAS_W / 2, CANVAS_H - 56, t('play'), 0x00c853, '#ffffff', Math.min(280, CANVAS_W - 40), 52);
    let going = false;
    const startGame = () => {
      if (going) return;
      going = true;
      this.scene.start('GameScene', { personalBest: this.personalBest });
    };
    playBtn.gfx.on('pointerup', startGame);
    this.input.keyboard.on('keydown-SPACE', startGame);
    this.input.keyboard.on('keydown-ENTER', startGame);

    // Escape key — back to menu
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
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
  parent:          'game',
  dom: {
    createContainer: true  // required for this.add.dom() language selector in LegendScene
  },
  ...(isMobile ? {
    scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH }
  } : {}),
  scene:           [MenuScene, GameScene, GameOverScene, LegendScene]
};

const game = new Phaser.Game(config);

// T031 — US3: DevTools accessor for telemetry inspection
// Usage: window.debugCardManager() in browser console
game.events.on('ready', () => {
  window.debugCardManager = () => {
    const gs = game.scene.getScene('GameScene');
    return gs && gs.cardManager
      ? { telemetry: gs.cardManager.telemetry, queue: gs.cardManager.queue.length, activeCard: gs.cardManager.activeCard }
      : null;
  };
});
