// ─── Scene Data ─────────────────────────────────────────────────────────────
const SCENES = [
  {
    id: 0,
    title: 'The Sacred Harvest',
    background: 'images/scene1/background.png',
    instruction: 'Which seed grows the grain that feeds Egypt?',
    missingLabel: 'Wheat',
    missingImage: 'images/scene1/wheat.png',
    // Elements shown in the scene (left to right), missing slot inserted between them
    elements: [
      { image: 'images/scene1/cow.png',           label: 'Sacred Cow',    left: 330 },
      { image: 'images/scene1/farmer.png',        label: 'Farmer',        left: 580 },
      { image: 'images/scene1/bowl_of_bread.png', label: 'Bread Offering',left: 880 },
    ],
    missingLeft: 80,
    // Seed options: answer + 3 wrong
    seeds: [
      { id: 'wheat',   image: 'seeds/wheat_seed.png',   label: 'Wheat Seeds',   tooltip: 'Emmer Wheat — staff of life along the Nile', correct: true  },
      { id: 'flax',    image: 'seeds/flax_seed.png',    label: 'Flax Seeds',    tooltip: 'Flax — spun into sacred linen cloth',         correct: false },
      { id: 'papyrus', image: 'seeds/papyrus_seed.png', label: 'Papyrus Seeds', tooltip: 'Papyrus — the reed of Thoth the scribe',      correct: false },
      { id: 'lotus',   image: 'seeds/lotus_seed.png',   label: 'Lotus Seeds',   tooltip: 'Lotus — sacred flower of rebirth',             correct: false },
    ],
  },
  {
    id: 1,
    title: 'The Loom of Isis',
    background: 'images/scene2/background.png',
    instruction: 'Which seed grows the plant woven into sacred cloth?',
    missingLabel: 'Flax',
    missingImage: 'images/scene2/flax.png',
    elements: [
      { image: 'images/scene2/spindle.png',    label: 'Spindle',    left: 330 },
      { image: 'images/scene2/weaver.png',     label: 'Weaver',     left: 580 },
      { image: 'images/scene2/linen_cloth.png',label: 'Linen Cloth',left: 880 },
    ],
    missingLeft: 80,
    seeds: [
      { id: 'flax',    image: 'seeds/flax_seed.png',    label: 'Flax Seeds',    tooltip: 'Flax — spun into sacred linen cloth',         correct: true  },
      { id: 'wheat',   image: 'seeds/wheat_seed.png',   label: 'Wheat Seeds',   tooltip: 'Emmer Wheat — grain of the harvest god',      correct: false },
      { id: 'papyrus', image: 'seeds/papyrus_seed.png', label: 'Papyrus Seeds', tooltip: 'Papyrus — the reed of Thoth the scribe',      correct: false },
      { id: 'lotus',   image: 'seeds/lotus_seed.png',   label: 'Lotus Seeds',   tooltip: 'Lotus — sacred flower of rebirth',             correct: false },
    ],
  },
  {
    id: 2,
    title: 'The Words of Thoth',
    background: 'images/scene3/background.png',
    instruction: 'Which seed grows the plant that holds the words of the gods?',
    missingLabel: 'Papyrus',
    missingImage: 'images/scene3/papyrus.png',
    elements: [
      { image: 'images/scene3/scribe.png', label: 'Scribe',      left: 330 },
      { image: 'images/scene3/ibis.png',   label: 'Sacred Ibis', left: 580 },
      { image: 'images/scene3/scroll.png', label: 'Scroll',      left: 880 },
    ],
    missingLeft: 80,
    seeds: [
      { id: 'papyrus', image: 'seeds/papyrus_seed.png', label: 'Papyrus Seeds', tooltip: 'Papyrus — the reed of Thoth the scribe',      correct: true  },
      { id: 'wheat',   image: 'seeds/wheat_seed.png',   label: 'Wheat Seeds',   tooltip: 'Emmer Wheat — grain of the harvest god',      correct: false },
      { id: 'flax',    image: 'seeds/flax_seed.png',    label: 'Flax Seeds',    tooltip: 'Flax — spun into sacred linen cloth',         correct: false },
      { id: 'lotus',   image: 'seeds/lotus_seed.png',   label: 'Lotus Seeds',   tooltip: 'Lotus — sacred flower of rebirth',             correct: false },
    ],
  },
];

// ─── State ───────────────────────────────────────────────────────────────────
let currentSceneIndex = 0;
let score = 0;
let selectedSeedId = null;   // for click-to-place
let draggedSeedId  = null;   // for drag-and-drop
let sceneResolved  = false;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const sceneBg        = document.getElementById('scene-bg');
const sceneElements  = document.getElementById('scene-elements');
const missingSlot    = document.getElementById('missing-slot');
const slotHint       = document.getElementById('slot-hint');
const slotInner      = document.getElementById('slot-inner');
const seedOptions    = document.getElementById('seed-options');
const scoreDisplay   = document.getElementById('score');
const feedbackOverlay= document.getElementById('feedback-overlay');
const feedbackIcon   = document.getElementById('feedback-icon');
const feedbackMsg    = document.getElementById('feedback-msg');
const endScreen      = document.getElementById('end-screen');
const finalScore     = document.getElementById('final-score');
const playAgainBtn   = document.getElementById('play-again-btn');
const instructionText= document.getElementById('instruction-text');

// ─── Shuffle helper ───────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Load a scene ─────────────────────────────────────────────────────────────
function loadScene(index) {
  sceneResolved = false;
  selectedSeedId = null;
  draggedSeedId  = null;

  const scene = SCENES[index];

  // Update instruction
  instructionText.textContent = scene.instruction;

  // Background
  sceneBg.src = scene.background;

  // Update progress dots
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.remove('active', 'solved');
    if (i < index)       dot.classList.add('solved');
    else if (i === index) dot.classList.add('active');
  });

  // Clear scene elements
  sceneElements.innerHTML = '';

  // Place scene elements
  scene.elements.forEach((el, i) => {
    const div = document.createElement('div');
    div.className = 'scene-element';
    div.style.left = el.left + 'px';
    div.style.animationDelay = (i * 0.15) + 's';

    const img = document.createElement('img');
    img.src = el.image;
    img.alt = el.label;

    const lbl = document.createElement('span');
    lbl.className = 'element-label';
    lbl.textContent = el.label;

    div.appendChild(img);
    div.appendChild(lbl);
    sceneElements.appendChild(div);
  });

  // Position missing slot
  missingSlot.style.left = scene.missingLeft + 'px';

  // Reset slot to question-mark state
  slotInner.innerHTML = '<span id="slot-hint">?</span>';
  missingSlot.className = 'slot-glow';
  missingSlot.style.cursor = 'pointer';

  // Drag events on slot
  missingSlot.ondragover  = (e) => { e.preventDefault(); missingSlot.classList.add('drag-over'); };
  missingSlot.ondragleave = ()  => { missingSlot.classList.remove('drag-over'); };
  missingSlot.ondrop      = (e) => { e.preventDefault(); missingSlot.classList.remove('drag-over'); handleAnswer(draggedSeedId); };
  missingSlot.onclick     = ()  => { if (selectedSeedId) handleAnswer(selectedSeedId); };

  // Build seed tray (shuffled)
  seedOptions.innerHTML = '';
  const shuffledSeeds = shuffle(scene.seeds);
  shuffledSeeds.forEach(seed => {
    const card = createSeedCard(seed);
    seedOptions.appendChild(card);
  });

  // Animate scene in
  const sceneArea = document.getElementById('scene-area');
  sceneArea.style.opacity = '0';
  requestAnimationFrame(() => {
    sceneArea.style.transition = 'opacity 0.5s';
    sceneArea.style.opacity    = '1';
  });
}

// ─── Create a seed card ───────────────────────────────────────────────────────
function createSeedCard(seed) {
  const card = document.createElement('div');
  card.className     = 'seed-card';
  card.dataset.id    = seed.id;
  card.dataset.correct = seed.correct ? '1' : '0';
  card.setAttribute('data-tooltip', seed.tooltip);
  card.draggable = true;

  const img = document.createElement('img');
  img.src = seed.image;
  img.alt = seed.label;

  const lbl = document.createElement('span');
  lbl.className   = 'seed-card-label';
  lbl.textContent = seed.label;

  card.appendChild(img);
  card.appendChild(lbl);

  // Click-to-select
  card.addEventListener('click', () => {
    if (sceneResolved) return;
    if (card.classList.contains('used')) return;

    // Toggle selection
    if (selectedSeedId === seed.id) {
      selectedSeedId = null;
      card.classList.remove('selected');
    } else {
      // Deselect previous
      document.querySelectorAll('.seed-card.selected').forEach(c => c.classList.remove('selected'));
      selectedSeedId = seed.id;
      card.classList.add('selected');
    }
  });

  // Drag-and-drop
  card.addEventListener('dragstart', (e) => {
    if (sceneResolved) { e.preventDefault(); return; }
    draggedSeedId = seed.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });

  return card;
}

// ─── Handle an answer attempt ─────────────────────────────────────────────────
function handleAnswer(seedId) {
  if (!seedId || sceneResolved) return;

  const scene = SCENES[currentSceneIndex];
  const seed  = scene.seeds.find(s => s.id === seedId);
  if (!seed) return;

  const card = document.querySelector(`.seed-card[data-id="${seedId}"]`);

  if (seed.correct) {
    // ── Correct ──
    sceneResolved = true;
    score += 100;
    scoreDisplay.textContent = score;

    // Fill the slot with the correct crop image
    slotInner.innerHTML = '';
    const img = document.createElement('img');
    img.src = scene.missingImage;
    img.alt = scene.missingLabel;
    img.classList.add('shimmer');
    slotInner.appendChild(img);

    missingSlot.classList.remove('slot-glow');
    missingSlot.classList.add('correct');
    missingSlot.style.cursor = 'default';

    if (card) card.classList.add('correct-seed', 'used');

    // Deselect
    selectedSeedId = null;

    // Show feedback then advance
    showFeedback('correct', scene.missingLabel);
    setTimeout(() => {
      hideFeedback();
      if (currentSceneIndex < SCENES.length - 1) {
        currentSceneIndex++;
        loadScene(currentSceneIndex);
      } else {
        showEndScreen();
      }
    }, 1800);

  } else {
    // ── Wrong ──
    if (card) {
      card.classList.add('wrong-seed');
      card.classList.remove('selected');
      setTimeout(() => card.classList.remove('wrong-seed'), 500);
    }

    missingSlot.classList.add('wrong');
    setTimeout(() => missingSlot.classList.remove('wrong'), 500);

    // Deselect
    selectedSeedId = null;
    document.querySelectorAll('.seed-card.selected').forEach(c => c.classList.remove('selected'));

    showFeedback('wrong', seed.label);
    setTimeout(() => hideFeedback(), 1200);
  }
}

// ─── Feedback overlay ─────────────────────────────────────────────────────────
function showFeedback(type, label) {
  feedbackOverlay.classList.remove('hidden');
  if (type === 'correct') {
    feedbackIcon.textContent = '☀️';
    feedbackMsg.textContent  = `${label} — the gods smile upon you!`;
    feedbackBox_style('rgba(20,80,20,0.9)', '#50c878');
  } else {
    feedbackIcon.textContent = '🪲';
    feedbackMsg.textContent  = `${label} does not grow this crop. Try again!`;
    feedbackBox_style('rgba(80,10,10,0.9)', '#e03030');
  }
}

function feedbackBox_style(bg, border) {
  const box = document.getElementById('feedback-box');
  box.style.background   = bg;
  box.style.borderColor  = border;
  box.style.boxShadow    = `0 0 60px ${border}55`;
}

function hideFeedback() {
  feedbackOverlay.classList.add('hidden');
}

// ─── End screen ───────────────────────────────────────────────────────────────
function showEndScreen() {
  // Mark last dot solved
  document.querySelectorAll('.dot').forEach(dot => dot.classList.add('solved'));
  finalScore.textContent = score;
  endScreen.classList.remove('hidden');
}

playAgainBtn.addEventListener('click', () => {
  currentSceneIndex = 0;
  score = 0;
  scoreDisplay.textContent = 0;
  endScreen.classList.add('hidden');
  loadScene(0);
});

// ─── Scale game to viewport ───────────────────────────────────────────────────
function scaleGame() {
  const wrapper = document.getElementById('game-wrapper');
  const game    = document.getElementById('game');
  const scaleX  = window.innerWidth  / 1280;
  const scaleY  = window.innerHeight / 720;
  const scale   = Math.min(scaleX, scaleY, 1);
  game.style.transform       = `scale(${scale})`;
  game.style.transformOrigin = 'center center';
  wrapper.style.width        = window.innerWidth  + 'px';
  wrapper.style.height       = window.innerHeight + 'px';
}

window.addEventListener('resize', scaleGame);
scaleGame();

// ─── Start ────────────────────────────────────────────────────────────────────
loadScene(0);
