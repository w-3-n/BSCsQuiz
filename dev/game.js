// ─── Scene Data ─────────────────────────────────────────────────────────────
const SCENES = [
  {
    id: 0,
    title: '生物结皮类型',
    instruction: '哪些是常见的生物结皮类型？',
    slots: [
      { id: 1, type: 'empty', correctId: 'algal_crust',  label: '1号答案框' },
      { id: 2, type: 'empty', correctId: 'lichen_crust', label: '2号答案框' },
      { id: 3, type: 'empty', correctId: 'moss_crust',   label: '3号答案框' },
    ],
    options: [
      { id: 'algal_crust',  image: 'images/bscs/藻结皮.png',   label: '藻结皮', tooltip: '由藻类、真菌和细菌组成的混合结皮' },
      { id: 'lichen_crust', image: 'images/bscs/地衣结皮.png', label: '地衣结皮', tooltip: '地衣作为优势种的生物结皮' },
      { id: 'moss_crust_d', image: 'images/bscs/苔结皮.png',   label: '苔结皮', tooltip: '（干扰项）苔类结皮' },
      { id: 'moss_crust',   image: 'images/bscs/藓结皮.png',   label: '藓结皮', tooltip: '藓类作为优势种的生物结皮' },
    ],
  },
  {
    id: 1,
    title: '真核生物识别',
    instruction: '生物结皮的优势种里，哪些是真核生物？',
    slots: [
      { id: 1, type: 'fixed', image: 'images/bscs/银叶真藓.jpg', label: '银叶真藓' },
      { id: 2, type: 'empty', correctId: 'chlorella', label: '2号答案框' },
      { id: 3, type: 'empty', correctId: 'chlamydomonas', label: '3号答案框' },
    ],
    options: [
      { id: 'nostoc',    image: 'images/bscs/念珠藻.png',   label: '念珠藻',   tooltip: '原核生物 - 蓝藻门' },
      { id: 'chlorella', image: 'images/bscs/小球藻.png',   label: '小球藻',   tooltip: '真核生物 - 绿藻门' },
      { id: 'chlamydomonas', image: 'images/bscs/衣藻属.png', label: '衣藻属', tooltip: '真核生物 - 绿藻门' },
      { id: 'microcoleus', image: 'images/bscs/具鞘微鞘藻.png', label: '具鞘微鞘藻', tooltip: '原核生物 - 蓝藻门' },
    ],
  },
];

// ─── State ───────────────────────────────────────────────────────────────────
let currentSceneIndex = 0;
let score = 0;
let selectedOptionId = null;
let draggedOptionId  = null;
let solvedSlots = new Set();

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const sceneBg        = document.getElementById('scene-bg');
const slotsContainer  = document.getElementById('slots-container');
const optionTray     = document.getElementById('seed-options'); 
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
  solvedSlots.clear();
  selectedOptionId = null;
  draggedOptionId  = null;

  const scene = SCENES[index];
  instructionText.textContent = scene.instruction;
  
  // Background is now white in CSS, no image needed
  if (sceneBg) sceneBg.style.display = 'none';

  // Update progress dots
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.remove('active', 'solved');
    if (i < index)       dot.classList.add('solved');
    else if (i === index) dot.classList.add('active');
  });

  // Clear and Build Slots
  slotsContainer.innerHTML = '';
  scene.slots.forEach(slotData => {
    const slotDiv = document.createElement('div');
    slotDiv.className = 'answer-slot slot-glow';
    slotDiv.dataset.slotId = slotData.id;

    const inner = document.createElement('div');
    inner.className = 'slot-inner';

    if (slotData.type === 'fixed') {
      inner.innerHTML = `<img src="${slotData.image}" alt="${slotData.label}"><span class="fixed-label" style="position:absolute;bottom:5px;font-size:12px;background:rgba(0,0,0,0.5);padding:2px 5px;border-radius:4px;color:white;">${slotData.label}</span>`;
      slotDiv.classList.remove('slot-glow');
      slotDiv.classList.add('correct');
      solvedSlots.add(slotData.id);
    } else {
      inner.innerHTML = `<span class="slot-hint">${slotData.id}</span>`;
      
      // Events
      slotDiv.ondragover  = (e) => { e.preventDefault(); slotDiv.classList.add('drag-over'); };
      slotDiv.ondragleave = ()  => { slotDiv.classList.remove('drag-over'); };
      slotDiv.ondrop      = (e) => { e.preventDefault(); slotDiv.classList.remove('drag-over'); handleAnswer(draggedOptionId, slotData.id); };
      slotDiv.onclick     = ()  => { if (selectedOptionId) handleAnswer(selectedOptionId, slotData.id); };
    }

    slotDiv.appendChild(inner);
    slotsContainer.appendChild(slotDiv);
  });

  // Build Options Tray
  optionTray.innerHTML = '';
  const shuffledOptions = shuffle(scene.options);
  shuffledOptions.forEach(opt => {
    const card = createOptionCard(opt);
    optionTray.appendChild(card);
  });
}

function createOptionCard(opt) {
  const card = document.createElement('div');
  card.className     = 'seed-card'; 
  card.dataset.id    = opt.id;
  card.draggable = true;

  const img = document.createElement('img');
  img.src = opt.image;
  img.alt = opt.label;

  const lbl = document.createElement('span');
  lbl.className   = 'seed-card-label';
  lbl.textContent = opt.label;

  card.appendChild(img);
  card.appendChild(lbl);

  card.onclick = () => {
    if (card.classList.contains('used')) return;
    document.querySelectorAll('.seed-card.selected').forEach(c => c.classList.remove('selected'));
    if (selectedOptionId === opt.id) {
      selectedOptionId = null;
    } else {
      selectedOptionId = opt.id;
      card.classList.add('selected');
    }
  };

  card.ondragstart = (e) => {
    if (card.classList.contains('used')) { e.preventDefault(); return; }
    draggedOptionId = opt.id;
    card.classList.add('dragging');
  };

  card.ondragend = () => card.classList.remove('dragging');

  return card;
}

function handleAnswer(optionId, slotId) {
  if (!optionId || !slotId) return;
  if (solvedSlots.has(slotId)) return;

  const scene = SCENES[currentSceneIndex];
  const opt   = scene.options.find(o => o.id === optionId);

  // Get all valid correct IDs for this scene that haven't been placed yet
  const placedCorrectIds = Array.from(document.querySelectorAll('.answer-slot.correct img'))
    .map(img => {
      const optMatch = scene.options.find(o => o.label === img.alt);
      return optMatch ? optMatch.id : null;
    }).filter(id => id !== null);

  const allPossibleCorrectIds = scene.slots
    .filter(s => s.type === 'empty')
    .map(s => s.correctId);
  
  const isCorrect = allPossibleCorrectIds.includes(optionId) && !placedCorrectIds.includes(optionId);

  const slotDiv = document.querySelector(`.answer-slot[data-slot-id="${slotId}"]`);
  const card    = document.querySelector(`.seed-card[data-id="${optionId}"]`);

  if (isCorrect) {
    solvedSlots.add(slotId);
    score += 100;
    scoreDisplay.textContent = score;

    const inner = slotDiv.querySelector('.slot-inner');
    inner.innerHTML = `<img src="${opt.image}" alt="${opt.label}" class="shimmer">`;
    slotDiv.classList.remove('slot-glow');
    slotDiv.classList.add('correct');
    
    if (card) card.classList.add('used');
    selectedOptionId = null;
    document.querySelectorAll('.seed-card.selected').forEach(c => c.classList.remove('selected'));

    showFeedback('correct', opt.label);
    
    if (solvedSlots.size === scene.slots.length) {
      setTimeout(() => {
        hideFeedback();
        if (currentSceneIndex < SCENES.length - 1) {
          currentSceneIndex++;
          loadScene(currentSceneIndex);
        } else {
          showEndScreen();
        }
      }, 1500);
    } else {
      setTimeout(hideFeedback, 1000);
    }
  } else {
    score -= 100;
    scoreDisplay.textContent = score;

    slotDiv.classList.add('wrong');
    setTimeout(() => slotDiv.classList.remove('wrong'), 500);
    
    if (card) {
      card.classList.add('wrong-seed');
      setTimeout(() => card.classList.remove('wrong-seed'), 500);
    }
    
    showFeedback('wrong', opt.label);
    setTimeout(hideFeedback, 1000);
  }
}

function showFeedback(type, label) {
  feedbackOverlay.classList.remove('hidden');
  if (type === 'correct') {
    feedbackIcon.textContent = '🌱';
    feedbackMsg.textContent  = `${label} — 正确！`;
    feedbackBox_style('rgba(20,80,20,0.9)', '#a8e6cf');
  } else {
    feedbackIcon.textContent = '❌';
    feedbackMsg.textContent  = `好像不太对。再想想！`;
    feedbackBox_style('rgba(80,10,10,0.9)', '#ff8b94');
  }
}

function feedbackBox_style(bg, border) {
  const box = document.getElementById('feedback-box');
  box.style.background   = bg;
  box.style.borderColor  = border;
}

function hideFeedback() {
  feedbackOverlay.classList.add('hidden');
}

function showEndScreen() {
  document.querySelectorAll('.dot').forEach(dot => dot.classList.add('solved'));
  finalScore.textContent = score;
  endScreen.classList.remove('hidden');
}

playAgainBtn.onclick = () => {
  currentSceneIndex = 0;
  score = 0;
  scoreDisplay.textContent = 0;
  endScreen.classList.add('hidden');
  loadScene(0);
};

// ─── Start ────────────────────────────────────────────────────────────────────
loadScene(0);
