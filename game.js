// --- DOM Element Cache ---
const balanceDisplay = document.getElementById('balanceDisplay');
const rateDisplay = document.getElementById('rateDisplay');
const moneyButton = document.getElementById('moneyButton');
const systemResetButton = document.getElementById('systemReset');
const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const toggleAnimationsButton = document.getElementById('toggleAnimations');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game State & Database ---
let db = {
    cash: 0,
    mps: 0, // Money Per Second
    clickPower: 100,
    animationsEnabled: true,
    upgrades: {
        'u1': { owned: 0, cost: 200, baseRate: 10, costMultiplier: 1.25 },
        'u2': { owned: 0, cost: 1500, baseRate: 120, costMultiplier: 1.28 },
        'u3': { owned: 0, cost: 25000, baseRate: 1500, costMultiplier: 1.32 },
        'u4': { owned: 0, cost: 400000, baseRate: 18000, costMultiplier: 1.38 },
    }
};

// --- Game Data (Static) ---
const UPGRADE_META = {
    'u1': { name: 'AI Auto-Trading Bot' },
    'u2': { name: 'Lithium Mega-Factory' },
    'u3': { name: 'Acquire X (Twitter)' },
    'u4': { name: 'Fund Starship Rocket' },
};

// --- Persistence ---
function saveGame() {
    localStorage.setItem('moneyClickerSave', JSON.stringify(db));
}

function loadGame() {
    const savedData = localStorage.getItem('moneyClickerSave');
    if (savedData) {
        const loadedDb = JSON.parse(savedData);
        // Merge loaded data with default db to ensure new properties are added
        db = { ...db, ...loadedDb };
    }
}

// --- UI Refresh ---
function refreshUI() {
    balanceDisplay.textContent = '$' + Math.floor(db.cash).toLocaleString();
    rateDisplay.textContent = `Passive Income: $${db.mps.toLocaleString()} / sec`;

    for (const id in db.upgrades) {
        const upg = db.upgrades[id];
        document.getElementById(`${id}-meta`).textContent = `Generates +$${upg.baseRate.toLocaleString()}/sec (Owned: ${upg.owned})`;
        const btn = document.getElementById(`btn-${id}`);
        btn.textContent = `Cost: $${upg.cost.toLocaleString()}`;
        btn.disabled = db.cash < upg.cost;
    }

    // Update settings UI
    toggleAnimationsButton.textContent = db.animationsEnabled ? 'Disable Animations' : 'Enable Animations';
}

// --- Canvas & Animations ---
const particles = [];

function resizeScreen() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor(x, y, type = 'bill') {
        this.x = x; this.y = y; this.type = type;
        this.opacity = 1;

        if (type === 'bill') {
            this.vx = (Math.random() - 0.5) * 12;
            this.vy = -Math.random() * 8 - 10;
            this.angle = Math.random() * Math.PI * 2;
            this.spin = (Math.random() - 0.5) * 0.12;
            this.scaleW = Math.random() * 10 + 45;
            this.scaleH = this.scaleW / 2;
        } else { // 'floater'
            this.message = `+$${db.clickPower}`;
            this.vy = -2.5;
        }
    }

    tick() {
        this.y += this.vy;
        this.opacity -= 0.02;

        if (this.type === 'bill') {
            this.x += this.vx;
            this.vy += 0.4;
            this.angle += this.spin;
            this.vx *= 0.99;
            if (this.y > canvas.height - 150) this.opacity -= 0.015;
        }
    }

    render() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.opacity);
        if (this.type === 'bill') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = '#00c853';
            ctx.fillRect(-this.scaleW / 2, -this.scaleH / 2, this.scaleW, this.scaleH);
            ctx.strokeStyle = '#b9f6ca';
            ctx.lineWidth = 1;
            ctx.strokeRect(-this.scaleW / 2 + 2, -this.scaleH / 2 + 2, this.scaleW - 4, this.scaleH - 4);
        } else { // 'floater'
            ctx.fillStyle = '#00e676';
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.message, this.x, this.y);
        }
        ctx.restore();
    }
}

function createClickParticles(e) {
    if (!db.animationsEnabled) return;
    particles.push(new Particle(e.clientX, e.clientY - 25, 'floater'));
    for (let i = 0; i < 4; i++) {
        particles.push(new Particle(e.clientX, e.clientY, 'bill'));
    }
}

function createPassiveParticles() {
    if (!db.animationsEnabled || db.mps === 0) return;
    if (Math.random() < 0.25) {
        particles.push(new Particle(Math.random() * canvas.width, -30, 'bill'));
    }
}

// --- Event Listeners ---
window.addEventListener('resize', resizeScreen);

moneyButton.addEventListener('pointerdown', (e) => {
    db.cash += db.clickPower;
    createClickParticles(e);
    // UI will be refreshed in the next frame of the game loop
});

function registerUpgradeListener(id) {
    document.getElementById(`btn-${id}`).addEventListener('click', () => {
        const upg = db.upgrades[id];
        if (db.cash >= upg.cost) {
            db.cash -= upg.cost;
            upg.owned++;
            db.mps += upg.baseRate;
            upg.cost = Math.floor(upg.cost * upg.costMultiplier);
        }
    });
}

Object.keys(db.upgrades).forEach(id => registerUpgradeListener(id));

systemResetButton.addEventListener('click', () => {
    if (confirm('Clear all production metrics and return to $0?')) {
        localStorage.clear();
        location.reload();
    }
});

// Settings Panel Listeners
settingsButton.addEventListener('click', () => settingsPanel.style.display = 'flex');
closeSettingsButton.addEventListener('click', () => settingsPanel.style.display = 'none');
toggleAnimationsButton.addEventListener('click', () => {
    db.animationsEnabled = !db.animationsEnabled;
    if (!db.animationsEnabled) {
        particles.length = 0; // Clear existing particles
    }
    refreshUI();
});

// --- Game Loop ---
let lastTime = 0;
let saveCounter = 0;

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // Time in seconds
    lastTime = currentTime;

    // --- Logic ---
    // Passive income
    if (db.mps > 0) {
        db.cash += db.mps * deltaTime;
        createPassiveParticles();
    }

    // Particle simulation
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].tick();
        if (particles[i].opacity <= 0) {
            particles.splice(i, 1);
        }
    }

    // --- Drawing ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (db.animationsEnabled) {
        for (const particle of particles) {
            particle.render();
        }
    }
    
    refreshUI();

    // --- Save Game Periodically ---
    saveCounter += deltaTime;
    if (saveCounter >= 2) { // Save every 2 seconds
        saveGame();
        saveCounter = 0;
    }

    requestAnimationFrame(gameLoop);
}

// --- Initialization ---
function init() {
    loadGame();
    resizeScreen();
    requestAnimationFrame(gameLoop);
}

init();