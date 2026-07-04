let db = {
    cash: parseFloat(localStorage.getItem('m6_csh')) || 0.0,
    mps: parseInt(localStorage.getItem('m6_mps')) || 0,
    clickPower: parseInt(localStorage.getItem('m6_clp')) || 1,
    diamonds: parseInt(localStorage.getItem('m6_dia')) || 0,
    prestigeTokens: parseInt(localStorage.getItem('m6_ptk')) || 0,
    permMultiplier: parseFloat(localStorage.getItem('m6_pmu')) || 1.0,
    totalHistoricalClicks: parseInt(localStorage.getItem('m6_hcl')) || 0,
    fxEnabled: localStorage.getItem('m6_fx') !== 'false',
    soundEnabled: localStorage.getItem('m6_snd') !== 'false',
    upgradesOwned: JSON.parse(localStorage.getItem('m6_upg_owned')) || {},
    upgradesCost: JSON.parse(localStorage.getItem('m6_upg_cost')) || {}
};

let autoClickerState = {
    isActive: JSON.parse(localStorage.getItem('m6_ac_active')) || false,
    timeLeft: parseFloat(localStorage.getItem('m6_ac_time')) || 0,
    cooldownLeft: parseFloat(localStorage.getItem('m6_ac_cooldown')) || 0,
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const dollarBills = [];
const floaters = [];
let activeTab = 'all';
let searchQuery = '';
let isStoreBuilt = false;

let frenzyTimer = 0;
let saveTimer = 0;
let clickBuffTimer = 0;
let passiveBuffTimer = 0;
const FRENZY_MULT = 7;

const upgradesDatabase = [];
const premiumDatabase = [
    { id: 'p_warp', name: "Instant 2-Hour Cash Injection", desc: "Compress operational timelines. Instantly collect 2 hours of current passive returns.", cost: 3, type: 'warp' },
    { id: 'p_mult', name: "Permanent 2x Factory Synergy", desc: "Apply specialized management algorithms to double all passive output streams permanently.", cost: 10, type: 'mult' },
    { id: 'p_click', name: "Supercharged Kinetic Click Core", desc: "Permanently appends +250 base value to all manual click actions.", cost: 6, type: 'clicker' }
];

const smallBizList = ["Lemonade Stand", "Specialty Coffee Cart", "Artisan Bakery Studio", "Independent Laundromat", "Suburban Fitness Hub", "E-Commerce Logistics Hub", "Micro-Brewery Facility"];
const enterpriseList = ["Commercial Retail Complex", "Regional Distribution Network", "Enterprise SaaS Network", "High-Density Data Center", "National Investment Syndicate", "Global Rail Freight Array"];
const emojis = ["🍋", "☕", "🍞", "🧺", "🏋️", "📦", "🍺", "🏢", "🚚", "💻", "💾", "📈", "🚊", "👑", "💎"];

// DYNAMIC ROUTING & INTERCEPTOR ADAPTERS FOR EXPLICIT ERROR TRIGGERING
window.onerror = function(message, source, lineno, colno, error) {
    triggerDynamicErrorPage(500, "Internal Server Error", `An unhandled exception runtime error crashed your operation. context: ${message} inside line ${lineno}`);
    return true;
};

function triggerDynamicErrorPage(code, title, description) {
    document.getElementById('page-game').classList.remove('active');
    document.getElementById('page-blog').classList.remove('active');

    document.getElementById('errorStatusCode').textContent = code;
    document.getElementById('errorPageTitle').textContent = title;
    document.getElementById('errorPageDesc').textContent = description;

    const logBox = document.getElementById('errorStackTraceLog');
    if (code === 500) {
        logBox.style.display = "block";
        logBox.textContent = `SYSTEM HALT TRACE LOG:\nCODE_BLOCK_INTERCEPT:\nSTAMP: ${Date.now()}\nTARGET: money_clicker_core_module.js\nSTATUS: LOCKED`;
    } else {
        logBox.style.display = "none";
    }

    document.getElementById('page-error').classList.add('active');
}

function recoverFromErrorPage() {
    document.getElementById('page-error').classList.remove('active');
    window.location.hash = "";
    showPage('game');
}

function buildUpgrades() {
    upgradesDatabase.push({ id: 0, name: "Manual Task Entry", type: "tapper", rate: 1, baseCost: 15, emoji: "🖱️" });
    upgradesDatabase.push({ id: 1, name: "Automated Lemonade Asset", type: "passive", rate: 1, baseCost: 60, emoji: "🍋" });

    let currentCost = 200;
    let currentRate = 4;

    for (let i = 2; i < 100; i++) {
        const isTapper = i % 6 === 0;
        let name = "";
        let rate = 0;
        let emoji = emojis[i % emojis.length];

        if (isTapper) {
            name = `Ergonomic Click Core Tier ${Math.floor(i/6)+1}`;
            rate = Math.max(2, Math.floor(currentRate * 0.4));
        } else {
            if (i < 45) {
                name = smallBizList[i % smallBizList.length] + ` Asset (#${Math.floor(i/7)+1})`;
            } else {
                name = enterpriseList[i % enterpriseList.length] + ` Group (v${Math.floor(i/6)+1})`;
            }
            rate = currentRate;
        }

        upgradesDatabase.push({
            id: i, name: name, type: isTapper ? "tapper" : "passive", rate: rate, baseCost: currentCost, emoji: emoji
        });

        currentCost = Math.floor(currentCost * 1.25);
        if (!isTapper) currentRate = Math.floor(currentRate * 1.22) + 2;
    }
}
buildUpgrades();

function saveSystem() {
    localStorage.setItem('m6_csh', db.cash);
    localStorage.setItem('m6_mps', db.mps);
    localStorage.setItem('m6_clp', db.clickPower);
    localStorage.setItem('m6_dia', db.diamonds);
    localStorage.setItem('m6_ptk', db.prestigeTokens);
    localStorage.setItem('m6_pmu', db.permMultiplier);
    localStorage.setItem('m6_hcl', db.totalHistoricalClicks);
    localStorage.setItem('m6_fx', db.fxEnabled);
    localStorage.setItem('m6_snd', db.soundEnabled);
    localStorage.setItem('m6_upg_owned', JSON.stringify(db.upgradesOwned));
    localStorage.setItem('m6_upg_cost', JSON.stringify(db.upgradesCost));
    localStorage.setItem('m6_last_save', Date.now());
    localStorage.setItem('m6_ac_active', autoClickerState.isActive);
    localStorage.setItem('m6_ac_time', autoClickerState.timeLeft);
    localStorage.setItem('m6_ac_cooldown', autoClickerState.cooldownLeft);
}

function playChimeClick() {
    if (!db.soundEnabled) return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } catch (err) {}
}

function renderStore() {
    const listContainer = document.getElementById('upgradesList');
    if (!listContainer) return;

    if (isStoreBuilt) {
        upgradesDatabase.forEach(item => {
            const card = document.getElementById(`card-u-${item.id}`);
            if (!card) return;
            const matchesTab = (activeTab === 'all' || item.type === activeTab);
            const matchesSearch = (!searchQuery || item.name.toLowerCase().includes(searchQuery));
            card.style.display = (matchesTab && matchesSearch) ? 'flex' : 'none';

            const owned = db.upgradesOwned[item.id] || 0;
            const cost = db.upgradesCost[item.id] || item.baseCost;

            const countText = document.getElementById(`count-u-${item.id}`);
            if (countText) {
                countText.innerHTML = `(Owned: ${owned}) ${owned >= 10 ? '<span style="color:var(--accent-gold); font-weight:bold;">[Synergy]</span>' : ''}`;
            }

            const btn = document.getElementById(`btn-u-${item.id}`);
            if (btn) {
                btn.textContent = `Cost: $${cost.toLocaleString()}`;
                btn.disabled = db.cash < cost;
            }
        });

        premiumDatabase.forEach(item => {
            const card = document.getElementById(`card-p-${item.id}`);
            if (card) card.style.display = (activeTab === 'premium') ? 'flex' : 'none';
            const btn = document.getElementById(`btn-p-${item.id}`);
            if (btn) btn.disabled = db.diamonds < item.cost;
        });
        return;
    }

    listContainer.innerHTML = "";

    upgradesDatabase.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.id = `card-u-${item.id}`;
        card.innerHTML = `
            <div class="item-details">
                <h4>${item.emoji} ${item.name}</h4>
                <p>${item.type === 'tapper' ? `Manual Yield: +$${item.rate.toLocaleString()}` : `Passive Value: +$${item.rate.toLocaleString()}/sec`} <span id="count-u-${item.id}">(Owned: 0)</span></p>
            </div>
            <button class="purchase-btn" id="btn-u-${item.id}" onclick="buyUpgrade(${item.id})">Cost: $${item.baseCost}</button>
        `;
        listContainer.appendChild(card);
    });

    premiumDatabase.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card premium-card';
        card.id = `card-p-${item.id}`;
        card.style.display = 'none';
        card.innerHTML = `
            <div class="item-details">
                <h4 style="color: var(--accent-purple);">💎 ${item.name}</h4>
                <p style="color: #b8c9db;">${item.desc}</p>
            </div>
            <button class="purchase-btn premium-buy" id="btn-p-${item.id}" onclick="buyPremium('${item.id}')">Redeem for ${item.cost} Diamonds</button>
        `;
        listContainer.appendChild(card);
    });

    isStoreBuilt = true;
}

function buyUpgrade(id) {
    const item = upgradesDatabase.find(u => u.id === id);
    const cost = db.upgradesCost[id] || item.baseCost;

    if (db.cash >= cost) {
        db.cash -= cost;
        db.upgradesOwned[id] = (db.upgradesOwned[id] || 0) + 1;
        db.upgradesCost[id] = Math.floor(cost * 1.15);

        if (window.va) {
            window.va('event', { name: 'Buy Upgrade', data: { upgradeName: item.name, upgradeId: id, cost: cost } });
        }

        calculateYieldBalances();
        refreshUI();
        saveSystem();
    }
}

function buyPremium(id) {
    const item = premiumDatabase.find(p => p.id === id);
    if (db.diamonds >= item.cost) {
        db.diamonds -= item.cost;

        if (window.va) {
            window.va('event', { name: 'Buy Premium', data: { itemName: item.name, itemId: id, cost: item.cost } });
        }

        if (item.type === 'warp') {
            const baselineMps = calculateYieldBalances(true);
            const proceeds = baselineMps * 7200;
            db.cash += proceeds;
            openModalMessage("Time Warp Deployed", `Operations processed. You instantly collected $${proceeds.toLocaleString()} of passive assets.`);
        } else if (item.type === 'mult') {
            db.permMultiplier *= 2.0;
            openModalMessage("Synergy Link Active", "All automated portfolios produce 2x values permanently.");
        } else if (item.type === 'clicker') {
            db.upgradesOwned['custom_buff_click'] = (db.upgradesOwned['custom_buff_click'] || 0) + 250;
            openModalMessage("Kinetic Matrix Added", "Manual processing arrays expanded. Base click actions yield extra cash.");
        }
        calculateYieldBalances();
        refreshUI();
        saveSystem();
    }
}

function calculateYieldBalances(returnOnly = false) {
    let passiveBase = 0;
    let tappingBase = 1;

    upgradesDatabase.forEach(item => {
        const owned = db.upgradesOwned[item.id] || 0;
        if (owned > 0) {
            let synergyBonus = owned >= 10 ? 2 : 1;
            if (item.type === 'passive') {
                passiveBase += (item.rate * owned * synergyBonus);
            } else {
                tappingBase += (item.rate * owned);
            }
        }
    });

    tappingBase += (db.upgradesOwned['custom_buff_click'] || 0);

    let prestigeBonus = 1 + (db.prestigeTokens * 0.1);
    let baseMps = Math.ceil(passiveBase * db.permMultiplier * prestigeBonus);
    let baseClick = Math.ceil(tappingBase * prestigeBonus);

    if (frenzyTimer > 0) { baseMps *= FRENZY_MULT; baseClick *= FRENZY_MULT; }
    if (passiveBuffTimer > 0) { baseMps *= 3; }
    if (clickBuffTimer > 0) { baseClick *= 5; }

    if (returnOnly) return baseMps;

    db.mps = baseMps;
    db.clickPower = baseClick;
}

function refreshUI() {
    document.getElementById('balanceDisplay').textContent = '$' + Math.floor(db.cash).toLocaleString();
    document.getElementById('rateDisplay').textContent = `Passive Income: $${db.mps.toLocaleString()} / sec`;
    document.getElementById('premiumDisplay').textContent = db.diamonds;
    document.getElementById('prestigeDisplay').textContent = `Prestige Level: ${db.prestigeTokens} (+${db.prestigeTokens * 10}% Production Bonus)`;

    const clickTracker = document.getElementById('clickValueTracker');
    if (clickTracker) clickTracker.textContent = `Value Per Click: $${db.clickPower.toLocaleString()}`;

    let isFrenzyActive = (frenzyTimer > 0 || passiveBuffTimer > 0 || clickBuffTimer > 0);
    document.getElementById('frenzyNotice').style.display = isFrenzyActive ? 'block' : 'none';
    if (isFrenzyActive) {
        let text = "⚡ ACTIVE MODIFIERS: ";
        if (frenzyTimer > 0) text += `[Golden Frenzy x7: ${Math.ceil(frenzyTimer)}s] `;
        if (passiveBuffTimer > 0) text += `[Viral Hype x3 Production: ${Math.ceil(passiveBuffTimer)}s] `;
        if (clickBuffTimer > 0) text += `[Overclock x5 Click: ${Math.ceil(clickBuffTimer)}s] `;
        document.getElementById('frenzyNotice').textContent = text;
    }

    const autoClickerStatus = document.getElementById('autoClickerStatus');
    if (autoClickerStatus) {
        if (autoClickerState.isActive) {
            autoClickerStatus.innerHTML = `Active for <strong>${Math.ceil(autoClickerState.timeLeft)}s</strong>`;
        } else if (autoClickerState.cooldownLeft > 0) {
            autoClickerStatus.innerHTML = `Cooldown: <strong>${Math.ceil(autoClickerState.cooldownLeft / 60)}m</strong>`;
        } else {
            autoClickerStatus.innerHTML = `Ready to Activate`;
        }
    }
    renderStore();
}

function filterStore(tab) {
    document.getElementById('tab-all').classList.remove('active');
    document.getElementById('tab-tapper').classList.remove('active');
    document.getElementById('tab-passive').classList.remove('active');
    document.getElementById('tab-premium').classList.remove('active');
    if(document.getElementById(`tab-${tab}`)) document.getElementById(`tab-${tab}`).classList.add('active');
    activeTab = tab;
    renderStore();
}

function searchStore() {
    searchQuery = document.getElementById('storeSearch').value.toLowerCase().trim();
    renderStore();
}

function showPage(pageId) {
    if (pageId !== 'game' && pageId !== 'blog') {
        triggerDynamicErrorPage(404, "Page Route Not Found", "The secure navigational system hash layout string you targeted does not connect to a valid operational index.");
        return;
    }

    document.getElementById('page-game').classList.remove('active');
    document.getElementById('page-blog').classList.remove('active');
    document.getElementById('page-error').classList.remove('active');

    document.getElementById('btnPageGame').classList.remove('active');
    document.getElementById('btnPageBlog').classList.remove('active');

    document.getElementById(`page-${pageId}`).classList.add('active');
    document.getElementById(`btnPage${pageId.charAt(0).toUpperCase() + pageId.slice(1)}`).classList.add('active');
    if (pageId === 'game') refreshUI();
}

function sharePost(msg) {
    const inputTemp = document.createElement('input');
    inputTemp.value = msg; document.body.appendChild(inputTemp);
    inputTemp.select(); document.execCommand('copy'); document.body.removeChild(inputTemp);
    openModalMessage("Link Exported!", "Promotion URL committed to clipboard systems.");
}

function openModalMessage(title, text) {
    drawer.style.display = 'flex'; dTitle.textContent = title;
    dBody.innerHTML = `<p>${text}</p><div class="dialog-buttons"><button class="dialog-btn-cancel" onclick="closeDrawer()">OK</button></div>`;
}

function triggerGoldenIngotSpawn() {
    const container = document.getElementById('goldenIngotLayer');
    if (!container) return;
    const ingot = document.createElement('div');
    ingot.className = 'golden-ingot-shock'; ingot.innerHTML = "👑";

    const x = Math.random() * (window.innerWidth - 100) + 20;
    const y = Math.random() * (window.innerHeight - 200) + 80;
    ingot.style.left = `${x}px`; ingot.style.top = `${y}px`;

    ingot.onclick = () => {
        playChimeClick(); container.removeChild(ingot);
        if (Math.random() > 0.5) {
            frenzyTimer = 20; calculateYieldBalances();
            openModalMessage("👑 GOLDEN SHOCK EVENT!", "You clicked the Golden Token! Global vectors boosted by 7x for 20 seconds!");
        } else {
            const dynamicGain = Math.max(500, calculateYieldBalances(true) * 120);
            db.cash += dynamicGain;
            openModalMessage("👑 GOLDEN FORTUNE!", `The Golden Token rewarded you an instant investment dividend of +$${dynamicGain.toLocaleString()}!`);
        }
        refreshUI();
    };
    container.appendChild(ingot);
    setTimeout(() => { if (container.contains(ingot)) container.removeChild(ingot); }, 12000);
}

setInterval(() => { if (Math.random() < 0.3) triggerGoldenIngotSpawn(); }, 20000);

function toggleFaqAccordion(element) {
    const parent = element.parentElement;
    const panel = element.nextElementSibling;

    if (parent.classList.contains('active')) {
        panel.style.maxHeight = null;
        parent.classList.remove('active');
    } else {
        document.querySelectorAll('.faq-block').forEach(block => {
            block.classList.remove('active');
            block.querySelector('.faq-answer-panel').style.maxHeight = null;
        });

        parent.classList.add('active');
        panel.style.maxHeight = panel.scrollHeight + "px";
    }
}

class PaperBill {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 18; this.vy = -Math.random() * 10 - 12;
        this.angle = Math.random() * Math.PI * 2; this.spin = (Math.random() - 0.5) * 0.2;
        this.opacity = 1; this.scaleW = Math.random() * 10 + 46; this.scaleH = this.scaleW / 1.8;
    }
    tick(dt) {
        this.x += this.vx * dt * 60; this.y += this.vy * dt * 60; this.vy += 0.5 * dt * 60;
        this.angle += this.spin * dt * 60; this.vx *= Math.pow(0.975, dt * 60);
        if (this.y > window.innerHeight - 80) this.opacity -= 0.04 * dt * 60;
    }
    render() {
        if (this.opacity <= 0) return;
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.fillStyle = '#013a12'; ctx.fillRect(-this.scaleW/2, -this.scaleH/2, this.scaleW, this.scaleH);
        ctx.fillStyle = '#00e676'; ctx.fillRect(-this.scaleW/2 + 2, -this.scaleH/2 + 2, this.scaleW - 4, this.scaleH - 4);
        ctx.restore();
    }
}

class DigitIndicator {
    constructor(x, y, message) { this.x = x; this.y = y; this.message = message; this.vy = -4; this.opacity = 1; }
    tick(dt) { this.y += this.vy * dt * 60; this.opacity -= 0.025 * dt * 60; }
    render() {
        if (this.opacity <= 0) return;
        ctx.save(); ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.font = 'bold 26px -apple-system, sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#00ff77'; ctx.shadowColor = 'rgba(0,230,118,1)'; ctx.shadowBlur = 12;
        ctx.fillText(this.message, this.x, this.y); ctx.restore();
    }
}

const mBtn = document.getElementById('moneyButton');
mBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    db.cash += db.clickPower;
    db.totalHistoricalClicks += 1;
    playChimeClick();

    mBtn.classList.add('clicking');
    setTimeout(() => mBtn.classList.remove('clicking'), 50);

    if(db.fxEnabled) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        floaters.push(new DigitIndicator(x, y - 25, `+$${db.clickPower.toLocaleString()}`));

        const burstLimit = Math.min(6, 40 - dollarBills.length);
        for(let i=0; i<burstLimit; i++) { dollarBills.push(new PaperBill(x, y)); }
    }
});

const drawer = document.getElementById('systemDrawer');
const dTitle = document.getElementById('drawerTitle');
const dBody = document.getElementById('drawerBody');

function openDrawer(type) {
    drawer.style.display = 'flex';
    if (type === 'prestige') {
        let formula = Math.floor(Math.sqrt(db.cash / 5000000));
        dTitle.textContent = "Perform Capital Prestige Rebirth";
        dBody.innerHTML = `
            <p>Reset your asset portfolio layout blocks to claim high-multiplier prestige levels (+10% production bonus each tier level).</p>
            <p>Requires cash threshold layer of at least $5,000,000.</p>
            <h4 style="color: var(--accent-gold); text-align:center; padding:0.5rem 0;">Gainable Tiers Now: +${formula}</h4>
            <div class="dialog-buttons">
                <button class="danger-action-btn" ${formula <= 0 ? 'disabled style="background:#1d2733; color:#445;"' : ''} onclick="confirmPrestigeReset(${formula})">Execute Capital Rebirth</button>
            </div>
        `;
    } else if (type === 'settings') {
        let totalBusinesses = 0;
        Object.values(db.upgradesOwned).forEach(v => { if (typeof v === 'number') totalBusinesses += v; });

        dTitle.textContent = "Preferences & Enterprise Metrics";
        dBody.innerHTML = `
            <div style="background:rgba(0,0,0,0.4); padding: 1rem; border-radius:12px; border:1px solid var(--panel-border); margin-bottom:12px;">
                <h4 style="color:var(--money-green); margin-bottom:0.5rem;">📊 Stats Matrix</h4>
                <p style="font-size:0.85rem;">Total Manual Clicks Actioned: <strong>${db.totalHistoricalClicks}</strong></p>
                <p style="font-size:0.85rem; margin-top:4px;">Total Commercial Assets Owned: <strong>${totalBusinesses} Tiers</strong></p>
                <p style="font-size:0.85rem; margin-top:4px;">Base Yield Scalar: <strong>${(db.permMultiplier * 100).toFixed(0)}%</strong></p>
            </div>
            <div class="setting-control">
                <div>
                    <span style="font-weight:bold;">🤖 Auto-Clicker Bot</span>
                    <div id="autoClickerStatus" style="font-size: 0.8rem; color: var(--text-muted);">Ready to Activate</div>
                </div>
                <button class="toggle-btn" id="autoClickerBtn" onclick="activateAutoClickerAd()" ${autoClickerState.cooldownLeft > 0 || autoClickerState.isActive ? 'disabled' : ''}>Activate</button>
            </div>
            <div class="setting-control"><span>High Fluidity Drop Animations</span><button class="toggle-btn ${db.fxEnabled ? 'active' : ''}" onclick="toggleVisuals()">Toggle</button></div>
            <div class="setting-control" style="margin-top: 10px;"><span>Audio Feedback Synthesizer</span><button class="toggle-btn ${db.soundEnabled ? 'active' : ''}" onclick="toggleAudioEngine()">Toggle</button></div>
            <div class="setting-control" style="margin-top: 10px;"><span>Dynamic Ads Wheel (10 Events)</span><button class="purchase-btn premium-buy" onclick="runAdEventFortuneWheel()">Trigger Random Ad Event</button></div>
            <div class="setting-control" style="margin-top:10px;"><button class="danger-action-btn" onclick="wipeLocalSystemCache()">Hard Reset Progression</button></div>
        `;
    }
}

function activateAutoClickerAd() {
    if (autoClickerState.cooldownLeft > 0 || autoClickerState.isActive) return;

    if (window.va) {
        window.va('event', { name: 'Activate AutoClicker' });
    }

    openModalMessage("Simulated Ad", "<div style='text-align:center; padding:1.5rem 0;'><p style='color:var(--accent-gold); font-weight:bold; animation:pulse 1s infinite;'>[ Watching Ad to Activate Auto-Clicker... ]</p><p style='font-size:0.85rem; margin-top:0.6rem; color:var(--text-muted);'>Activates in 3 seconds</p></div>");
    setTimeout(() => {
        autoClickerState.isActive = true;
        autoClickerState.timeLeft = 300; // 5 minutes
        closeDrawer();
        openModalMessage("🤖 Auto-Clicker Activated!", "The auto-clicker bot is now active for 5 minutes, generating income at your current click power.");
        openDrawer('settings'); // Re-open to see status
    }, 3000);
}

function closeDrawer() { drawer.style.display = 'none'; }
function toggleVisuals() { db.fxEnabled = !db.fxEnabled; saveSystem(); openDrawer('settings'); }
function toggleAudioEngine() { db.soundEnabled = !db.soundEnabled; saveSystem(); openDrawer('settings'); }

function runAdEventFortuneWheel() {
    closeDrawer();

    if (window.va) {
        window.va('event', { name: 'Fortune Wheel Spin' });
    }

    const randomIndex = Math.floor(Math.random() * 10) + 1;
    if (randomIndex <= 5) {
        openModalMessage("Streaming Video Ad Module...", "<div style='text-align:center; padding:1.5rem 0;'><p style='color:var(--accent-gold); font-weight:bold; animation:pulse 1s infinite;'>[ Loading Marketing Node Ad Data Stream... ]</p><p style='font-size:0.85rem; margin-top:0.6rem; color:var(--text-muted);'>Reward unlocks instantly in 3 seconds</p></div>");
        setTimeout(() => { closeDrawer(); executePremiumAdReward(randomIndex); }, 3000);
    } else {
        executeFreeLuckReward(randomIndex);
    }
}

function executePremiumAdReward(id) {
    let baselineMps = calculateYieldBalances(true);
    switch(id) {
        case 1:
            let gift = Math.max(1000, baselineMps * 3600); db.cash += gift;
            openModalMessage("📺 Ad Reward: Windfall Grant", `Angel investment group cleared your portfolio video! Granted an immediate capital dividend of +$${gift.toLocaleString()}!`);
            break;
        case 2:
            passiveBuffTimer = 30;
            openModalMessage("📺 Ad Reward: Viral Exposure Boost", "Your corporate marketing video clip went viral! Base passive enterprise yield operations multiplied by 3x for 30 seconds!");
            break;
        case 3:
            clickBuffTimer = 45;
            openModalMessage("📺 Ad Reward: Click Overclock Core", "Interactive tracking metrics systemized! Manual clicking arrays optimized at 5x power vectors for 45 seconds!");
            break;
        case 4:
            db.diamonds += 5;
            openModalMessage("📺 Ad Reward: Diamond Cache", "Diamond broker nodes recognized your attention vector! Loaded +5 Premium Diamonds to account ledger.");
            break;
        case 5:
            db.prestigeTokens += 1;
            openModalMessage("📺 Ad Reward: Prestige Infiltration", "Sovereign matrix systems loaded successfully. Awarded +1 Golden Prestige Level safely without wiping your businesses!");
            break;
    }
    calculateYieldBalances(); refreshUI(); saveSystem();
}

function executeFreeLuckReward(id) {
    let baselineMps = calculateYieldBalances(true);
    switch(id) {
        case 6:
            let saving = Math.max(250, baselineMps * 300); db.cash += saving;
            openModalMessage("🎉 Free Event: Tax Loophole Audited", `Your auditors managed to secure an immediate localized tax write-off value of +$${saving.toLocaleString()}!`);
            break;
        case 7:
            db.upgradesOwned['custom_buff_click'] = (db.upgradesOwned['custom_buff_click'] || 0) + 15;
            openModalMessage("🎉 Free Event: Synergy Realignment", "A micro core structural update occurred. Base manual processing value pushed up by +$15 permanently.");
            break;
        case 8:
            db.diamonds += 1;
            openModalMessage("🎉 Free Event: Diamond Matrix Spill", "Found 1 raw Premium Diamond tucked behind your system registry files! Balance modified.");
            break;
        case 9:
            frenzyTimer = 15;
            openModalMessage("🎉 Free Event: Macro Bull Run", "Global liquidity streams entered an absolute hype spike! All yields scaled by 7x for 15 seconds!");
            break;
        case 10:
            let drop = 2500; db.cash += drop;
            openModalMessage("🎉 Free Event: Seed Grant Drop", `A small independent regional venture incubator sent you a bonus envelope containing +$${drop.toLocaleString()} cash!`);
            break;
    }
    calculateYieldBalances(); refreshUI(); saveSystem();
}

function confirmPrestigeReset(tokens) {
    if(tokens > 0) {
        if (window.va) {
            window.va('event', { name: 'Prestige', data: { tokensGained: tokens, currentPrestige: db.prestigeTokens } });
        }
        db.prestigeTokens += tokens; db.cash = 0; db.upgradesOwned = {}; db.upgradesCost = {};
        isStoreBuilt = false; frenzyTimer = 0; clickBuffTimer = 0; passiveBuffTimer = 0;
        calculateYieldBalances(); saveSystem(); refreshUI(); closeDrawer();
    }
}

function wipeLocalSystemCache() { localStorage.clear(); location.reload(); }

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas); resizeCanvas();

let lastTickTime = performance.now();
function executeFrame(now) {
    const deltaSeconds = (now - lastTickTime) / 1000;
    lastTickTime = now;

    // --- Game Logic ---
    if (frenzyTimer > 0) { frenzyTimer -= deltaSeconds; if (frenzyTimer <= 0) { frenzyTimer = 0; calculateYieldBalances(); } }
    if (passiveBuffTimer > 0) { passiveBuffTimer -= deltaSeconds; if (passiveBuffTimer <= 0) { passiveBuffTimer = 0; calculateYieldBalances(); } }
    if (clickBuffTimer > 0) { clickBuffTimer -= deltaSeconds; if (clickBuffTimer <= 0) { clickBuffTimer = 0; calculateYieldBalances(); } }

    db.cash += (db.mps * deltaSeconds);

    if (autoClickerState.isActive) {
        const autoClickAmount = db.clickPower * 10 * deltaSeconds; // 10 clicks/sec
        db.cash += autoClickAmount;
        autoClickerState.timeLeft -= deltaSeconds;
        if (autoClickerState.timeLeft <= 0) {
            autoClickerState.isActive = false; autoClickerState.timeLeft = 0;
            autoClickerState.cooldownLeft = 600;
        }
    } else if (autoClickerState.cooldownLeft > 0) {
        autoClickerState.cooldownLeft -= deltaSeconds;
        if (autoClickerState.cooldownLeft <= 0) {
            autoClickerState.cooldownLeft = 0;
            const autoClickerBtn = document.getElementById('autoClickerBtn');
            if (autoClickerBtn) autoClickerBtn.disabled = false;
        }
    }

    if (db.fxEnabled && db.mps > 0 && Math.random() < 0.12 && dollarBills.length < 15) {
        dollarBills.push(new PaperBill(Math.random() * canvas.width, -30));
    }

    // --- Rendering ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let dt = deltaSeconds;
    if(db.fxEnabled) {
        for(let i = dollarBills.length - 1; i >= 0; i--) {
            dollarBills[i].tick(dt); dollarBills[i].render();
            if(dollarBills[i].opacity <= 0 || dollarBills[i].y > window.innerHeight) dollarBills.splice(i, 1);
        }
        for(let i = floaters.length - 1; i >= 0; i--) {
            floaters[i].tick(dt); floaters[i].render();
            if(floaters[i].opacity <= 0) floaters.splice(i, 1);
        }
    }

    refreshUI();

    // --- Save Throttling ---
    saveTimer += deltaSeconds;
    if (saveTimer >= 2.0) {
        saveSystem();
        saveTimer = 0;
    }

    requestAnimationFrame(executeFrame);
}

window.onload = function() {
    const lastSave = parseInt(localStorage.getItem('m6_last_save')) || 0;
    const now = Date.now();
    if (lastSave > 0) {
        const offlineSeconds = Math.min((now - lastSave) / 1000, 86400); // Cap at 24 hours
        if (offlineSeconds > 60) { // Only if offline for more than a minute
            calculateYieldBalances(); // Calculate current MPS first
            const offlineEarnings = db.mps * offlineSeconds * 0.5; // 50% of earnings
            if (offlineEarnings > 0) {
                db.cash += offlineEarnings;
                openModalMessage("Welcome Back!", `While you were away for ${Math.floor(offlineSeconds / 60)} minutes, your empire generated an additional <strong>$${Math.floor(offlineEarnings).toLocaleString()}</strong> in offline revenue!`);
            }
        }
    }

    calculateYieldBalances(); renderStore(); refreshUI(); requestAnimationFrame(executeFrame);

    // Check for illegal client window state hash parameters on startup
    if (window.location.hash && window.location.hash !== "#game" && window.location.hash !== "#blog") {
        triggerDynamicErrorPage(404, "Page Route Not Found", "The system route link or parameter chunk you tried to load doesn't exist or was removed.");
    }
};