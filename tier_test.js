// Tier matchup test: L1 armies vs L2 and L3 units at equal token budgets.
// Usage: node tier_test.js [matchesPerScenario]

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'strategos.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');
const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
const lastScript = scriptMatches[scriptMatches.length - 1].replace(/<\/?script[^>]*>/g, '');

const mockCtx = new Proxy({}, { get: () => () => ({}) });
const mockCanvas = {
    getContext: () => mockCtx, addEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 720, height: 1080 }),
    style: {}, width: 720, height: 1080,
};
global.window = { addEventListener: () => {}, __resetGame: false };
global.document = {
    getElementById: () => mockCanvas, addEventListener: () => {},
    createElement: () => ({ getContext: () => mockCtx, style: {}, width: 0, height: 0 }),
    body: { appendChild: () => {} },
};
global.Image = class {
    constructor() { this.complete = true; this.naturalWidth = 32; this._src = ''; }
    set src(v) { this._src = v; } get src() { return this._src; }
};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => 0;
global.setTimeout = setTimeout;
global.Peer = function () {};

let src = lastScript;
src += `
global.Game = Game; global.Unit = Unit; global.STATS = STATS;
global.ROWS = ROWS; global.COLS = COLS;
global.P1_ZONE = P1_ZONE; global.P2_ZONE = P2_ZONE;
global.INVESTED = INVESTED; global.MAX_ROSTER = MAX_ROSTER; global.L1_UNITS = L1_UNITS;
`;
try { eval(src); }
catch (e) { console.error('Script eval failed:', e.message); process.exit(1); }

// ---------- helpers (copied from ai_vs_ai.js) ----------
function flipAndSwap(g) {
    for (let u of [...g.p1Units, ...g.p2Units]) {
        u.player = 3 - u.player;
        u.facing = [-u.facing[0], -u.facing[1]];
    }
    const tmp = g.p1Units; g.p1Units = g.p2Units; g.p2Units = tmp;
}

function placeHard(g, units, zone) {
    const positions = [];
    for (let r = zone[0]; r <= zone[1]; r++)
        for (let c = 0; c < COLS; c++)
            if (!g.getUnitAt(r, c)) positions.push([r, c]);
    const front = positions.filter(([r]) => r === zone[1]);
    const back  = positions.filter(([r]) => r === zone[0]);
    const melee  = units.filter(u => STATS[u.type].rng === 1);
    const ranged = units.filter(u => STATS[u.type].rng > 1);
    for (const u of melee) {
        const pos = front.length ? front.shift() : (back.length ? back.shift() : positions.shift());
        if (pos) { u.r = pos[0]; u.c = pos[1]; }
    }
    for (const u of ranged) {
        const pos = back.length ? back.shift() : (front.length ? front.shift() : positions.shift());
        if (pos) { u.r = pos[0]; u.c = pos[1]; }
    }
}

function clearPlans(units) {
    for (const u of units) {
        u.plannedR = u.r; u.plannedC = u.c;
        u.plannedAtk = null; u.plannedTrap = null; u.plannedBeacon = null;
        u.plannedAid = null; u.plannedStealth = false; u.plannedShadow = null;
        u.plannedChannel = false; u.plannedRain = null; u.plannedBlink = null;
        u.ordered = false;
    }
}

// Run one match with forced compositions.
// P1 = p1Comp (array of type strings), P2 = p2Comp.
function runMatchForced(p1Comp, p2Comp, turnCap = 30) {
    const g = new Game();
    g.gameMode = 'AI';
    g.difficulty = 'Hard';
    g.budget = 99; // not used for shopping
    g.cullingTurn = 10;
    g.phase = 'MENU';
    g.initBoard();

    g.p1Units = p1Comp.map(t => new Unit(1, t));
    g.p2Units = p2Comp.map(t => new Unit(2, t));

    placeHard(g, g.p1Units, P1_ZONE);
    placeHard(g, g.p2Units, P2_ZONE);

    for (let turn = 0; turn < turnCap; turn++) {
        clearPlans(g.p1Units);
        clearPlans(g.p2Units);

        g.aiPlan();
        const p2Snap = g.p2Units.map(u => ({
            plannedR: u.plannedR, plannedC: u.plannedC, plannedAtk: u.plannedAtk,
            plannedTrap: u.plannedTrap, plannedBeacon: u.plannedBeacon, plannedAid: u.plannedAid,
            plannedStealth: u.plannedStealth, plannedShadow: u.plannedShadow,
            plannedChannel: u.plannedChannel, plannedRain: u.plannedRain,
            plannedBlink: u.plannedBlink, ordered: u.ordered,
        }));

        clearPlans(g.p1Units);
        clearPlans(g.p2Units);
        flipAndSwap(g);
        g.aiPlan();
        flipAndSwap(g);
        g.p2Units.forEach((u, i) => Object.assign(u, p2Snap[i]));

        g.resolveAction();
        const result = g.getGameOver();
        if (result !== 0) return result;
    }
    return 3;
}

// Pick a random composition from a list
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ---------- scenarios ----------
// Equal budget matchups: L1 swarm vs L2/L3 elites
const SCENARIOS = [
    // 6 tokens: 6 L1 vs 2 L2
    { name: '6 L1 mix  vs  2 Knights',           budget: 6,
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Knight','Knight'] },
    { name: '6 L1 mix  vs  2 Rogues',            budget: 6,
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Rogue','Rogue'] },
    { name: '6 L1 mix  vs  2 Mages',             budget: 6,
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Mage','Mage'] },
    { name: '6 L1 mix  vs  Knight+Rogue',         budget: 6,
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Knight','Rogue'] },
    { name: '6 L1 mix  vs  Knight+Mage',          budget: 6,
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Knight','Mage'] },

    // 6 tokens: 6 L1 vs 1 L3
    { name: '6 L1 mix  vs  1 Paladin',           budget: 6,
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Paladin'] },
    { name: '6 L1 mix  vs  1 Assassin',          budget: 6,
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Assassin'] },
    { name: '6 L1 mix  vs  1 Archmage',          budget: 6,
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Archmage'] },

    // 9 tokens: 9 L1 vs 3 L2
    { name: '9 L1 mix  vs  3 L2 mix',            budget: 9,
      p1: () => ['Squire','Squire','Squire','Archer','Archer','Archer','Adept','Adept','Adept'],
      p2: () => ['Knight','Rogue','Mage'] },

    // 9 tokens: 9 L1 vs L3 + L2
    { name: '9 L1 mix  vs  Paladin+Rogue',       budget: 9,
      p1: () => ['Squire','Squire','Squire','Archer','Archer','Archer','Adept','Adept','Adept'],
      p2: () => ['Paladin','Rogue'] },

    // Different L1 compositions to see which synergies matter
    { name: '6 Squires  vs  2 Knights',           budget: 6,
      p1: () => ['Squire','Squire','Squire','Squire','Squire','Squire'],
      p2: () => ['Knight','Knight'] },
    { name: '6 Archers  vs  2 Knights',           budget: 6,
      p1: () => ['Archer','Archer','Archer','Archer','Archer','Archer'],
      p2: () => ['Knight','Knight'] },
    { name: '6 Adepts   vs  2 Knights',           budget: 6,
      p1: () => ['Adept','Adept','Adept','Adept','Adept','Adept'],
      p2: () => ['Knight','Knight'] },
    { name: '3 Squire+3 Archer  vs  2 Knights',  budget: 6,
      p1: () => ['Squire','Squire','Squire','Archer','Archer','Archer'],
      p2: () => ['Knight','Knight'] },
];

// ---------- main ----------
const N = parseInt(process.argv[2] || '2000', 10);
console.log(`Running ${N} matches per scenario...\n`);

const results = [];
for (let sc of SCENARIOS) {
    let tally = { p1: 0, p2: 0, draw: 0, err: 0 };
    const t0 = Date.now();
    for (let i = 0; i < N; i++) {
        try {
            const r = runMatchForced(sc.p1(), sc.p2(), 30);
            if (r === 1) tally.p1++;
            else if (r === 2) tally.p2++;
            else if (r === 3) tally.draw++;
            else tally.err++;
        } catch (e) {
            tally.err++;
        }
    }
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const decided = tally.p1 + tally.p2;
    const p1pct = decided > 0 ? (100 * tally.p1 / decided).toFixed(1) : '—';
    const p2pct = decided > 0 ? (100 * tally.p2 / decided).toFixed(1) : '—';
    results.push({ name: sc.name, ...tally, p1pct, p2pct, elapsed });
    console.log(`  ${sc.name}`);
    console.log(`    L1 wins: ${tally.p1} (${p1pct}%)  |  Elite wins: ${tally.p2} (${p2pct}%)  |  Draws: ${tally.draw}  |  Errors: ${tally.err}  [${elapsed}s]`);
}

console.log('\n========================================');
console.log('SUMMARY — L1 (P1) vs Elite (P2)');
console.log('========================================');
console.log('Scenario'.padEnd(40) + 'L1 Win%'.padStart(8) + 'Elite%'.padStart(8) + 'Draws'.padStart(7));
console.log('-'.repeat(63));
for (let r of results) {
    console.log(r.name.padEnd(40) + `${r.p1pct}%`.padStart(8) + `${r.p2pct}%`.padStart(8) + `${r.draw}`.padStart(7));
}
