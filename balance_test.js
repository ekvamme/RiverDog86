// Balance test: simulate proposed changes without modifying strategos.html.
// Changes tested:
//   1. Archer "Readied Shot" — half-damage reaction fire when enemy enters adjacent tile
//   2. Adept Magic attack: 5 → 6
//   3. Knight Melee attack: 10 → 8
//   4. Paladin Melee attack: 14 → 12
//
// Runs the same tier matchups as tier_test.js, comparing BEFORE vs AFTER.
// Usage: node balance_test.js [matchesPerScenario]

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

// Save original stats for toggling
const ORIG_KNIGHT_ME = STATS.Knight.atk.Me;
const ORIG_PALADIN_ME = STATS.Paladin.atk.Me;
const ORIG_ADEPT_MA = STATS.Adept.atk.Ma;

function applyChanges() {
    STATS.Knight.atk.Me = 8;
    STATS.Paladin.atk.Me = 12;
    STATS.Adept.atk.Ma = 6;
}
function revertChanges() {
    STATS.Knight.atk.Me = ORIG_KNIGHT_ME;
    STATS.Paladin.atk.Me = ORIG_PALADIN_ME;
    STATS.Adept.atk.Ma = ORIG_ADEPT_MA;
}

// ---------- helpers ----------
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

// Readied Shot: after movement resolves but before normal attacks,
// each Archer fires a half-damage reaction shot at any enemy that
// ended up adjacent to it (once per Archer per turn).
function resolveReadiedShots(g, useReadiedShot) {
    if (!useReadiedShot) return;
    for (let u of [...g.p1Units, ...g.p2Units]) {
        if (u.type !== 'Archer' || u.hp <= 0) continue;
        let r = u.r, c = u.c;
        // Find first adjacent enemy
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                let nr = r + dr, nc = c + dc;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
                let enemy = g.getUnitAt(nr, nc);
                if (enemy && enemy.player !== u.player && STATS[enemy.type].weight === 3) {
                    // Half-damage Pierce shot
                    let dmg = Math.max(1, Math.floor((STATS.Archer.atk.P - STATS[enemy.type].dfn.P) / 2));
                    enemy.hp -= dmg;
                    break; // one shot per Archer per turn
                }
            }
        }
    }
    // Remove dead
    g.p1Units = g.p1Units.filter(u => u.hp > 0);
    g.p2Units = g.p2Units.filter(u => u.hp > 0);
}

function runMatchForced(p1Comp, p2Comp, useReadiedShot, turnCap = 30) {
    const g = new Game();
    g.gameMode = 'AI';
    g.difficulty = 'Hard';
    g.budget = 99;
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

        // Readied Shot fires after resolve (movement done, attacks done)
        resolveReadiedShots(g, useReadiedShot);

        const result = g.getGameOver();
        if (result !== 0) return result;
    }
    return 3;
}

const SCENARIOS = [
    { name: '6 L1 mix  vs  2 Knights',
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Knight','Knight'] },
    { name: '6 L1 mix  vs  2 Rogues',
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Rogue','Rogue'] },
    { name: '6 L1 mix  vs  2 Mages',
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Mage','Mage'] },
    { name: '6 L1 mix  vs  Knight+Rogue',
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Knight','Rogue'] },
    { name: '6 L1 mix  vs  Knight+Mage',
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Knight','Mage'] },
    { name: '6 L1 mix  vs  1 Paladin',
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Paladin'] },
    { name: '6 L1 mix  vs  1 Assassin',
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Assassin'] },
    { name: '6 L1 mix  vs  1 Archmage',
      p1: () => ['Squire','Squire','Archer','Archer','Adept','Adept'],
      p2: () => ['Archmage'] },
    { name: '9 L1 mix  vs  3 L2 mix',
      p1: () => ['Squire','Squire','Squire','Archer','Archer','Archer','Adept','Adept','Adept'],
      p2: () => ['Knight','Rogue','Mage'] },
    { name: '9 L1 mix  vs  Paladin+Rogue',
      p1: () => ['Squire','Squire','Squire','Archer','Archer','Archer','Adept','Adept','Adept'],
      p2: () => ['Paladin','Rogue'] },
    { name: '6 Squires  vs  2 Knights',
      p1: () => ['Squire','Squire','Squire','Squire','Squire','Squire'],
      p2: () => ['Knight','Knight'] },
    { name: '6 Archers  vs  2 Knights',
      p1: () => ['Archer','Archer','Archer','Archer','Archer','Archer'],
      p2: () => ['Knight','Knight'] },
    { name: '6 Adepts   vs  2 Knights',
      p1: () => ['Adept','Adept','Adept','Adept','Adept','Adept'],
      p2: () => ['Knight','Knight'] },
    { name: '3 Squire+3 Archer  vs  2 Knights',
      p1: () => ['Squire','Squire','Squire','Archer','Archer','Archer'],
      p2: () => ['Knight','Knight'] },
    // Also test that the nerfs don't break elite-vs-elite
    { name: 'Hard AI vs Hard AI (budget 8)',
      p1: () => null, p2: () => null, aiVsAi: true },
];

const N = parseInt(process.argv[2] || '2000', 10);

function runSuite(label, patched, useReadiedShot) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`  ${label}`);
    console.log(`${'='.repeat(70)}`);
    const results = [];
    for (let sc of SCENARIOS) {
        let tally = { p1: 0, p2: 0, draw: 0, err: 0 };
        for (let i = 0; i < N; i++) {
            try {
                let r;
                if (sc.aiVsAi) {
                    // Use standard Hard AI shopping for both sides
                    const g = new Game();
                    g.gameMode = 'AI'; g.difficulty = 'Hard'; g.budget = 8;
                    g.cullingTurn = 10; g.phase = 'MENU'; g.initBoard();
                    g.aiShop();
                    g.p1Units = g.p2Units.map(u => new Unit(1, u.type));
                    g.p2Units = []; g.aiShop();
                    g.aiPlace();
                    placeHard(g, g.p1Units, P1_ZONE);
                    for (let turn = 0; turn < 30; turn++) {
                        clearPlans(g.p1Units); clearPlans(g.p2Units);
                        g.aiPlan();
                        const snap = g.p2Units.map(u => ({
                            plannedR:u.plannedR, plannedC:u.plannedC, plannedAtk:u.plannedAtk,
                            plannedTrap:u.plannedTrap, plannedBeacon:u.plannedBeacon, plannedAid:u.plannedAid,
                            plannedStealth:u.plannedStealth, plannedShadow:u.plannedShadow,
                            plannedChannel:u.plannedChannel, plannedRain:u.plannedRain,
                            plannedBlink:u.plannedBlink, ordered:u.ordered,
                        }));
                        clearPlans(g.p1Units); clearPlans(g.p2Units);
                        flipAndSwap(g); g.aiPlan(); flipAndSwap(g);
                        g.p2Units.forEach((u,i) => Object.assign(u, snap[i]));
                        g.resolveAction();
                        resolveReadiedShots(g, useReadiedShot);
                        const res = g.getGameOver();
                        if (res !== 0) { r = res; break; }
                    }
                    if (r === undefined) r = 3;
                } else {
                    r = runMatchForced(sc.p1(), sc.p2(), useReadiedShot, 30);
                }
                if (r === 1) tally.p1++;
                else if (r === 2) tally.p2++;
                else if (r === 3) tally.draw++;
                else tally.err++;
            } catch (e) { tally.err++; }
        }
        const decided = tally.p1 + tally.p2;
        const p1pct = decided > 0 ? (100 * tally.p1 / decided).toFixed(1) : '—';
        const p2pct = decided > 0 ? (100 * tally.p2 / decided).toFixed(1) : '—';
        results.push({ name: sc.name, ...tally, p1pct, p2pct });
        console.log(`  ${sc.name}`);
        console.log(`    L1/P1: ${tally.p1} (${p1pct}%)  |  Elite/P2: ${tally.p2} (${p2pct}%)  |  Draws: ${tally.draw}`);
    }
    return results;
}

console.log(`Running ${N} matches per scenario, BEFORE and AFTER proposed changes...\n`);

// BEFORE (current stats, no readied shot)
revertChanges();
const before = runSuite('CURRENT BALANCE (no changes)', false, false);

// AFTER (patched stats + readied shot)
applyChanges();
const after = runSuite('PROPOSED: Knight 8 Me, Paladin 12 Me, Adept 6 Ma, Readied Shot', true, true);

// Revert
revertChanges();

// Side-by-side comparison
console.log(`\n${'='.repeat(80)}`);
console.log('  COMPARISON: L1/P1 win % (of decided matches)');
console.log(`${'='.repeat(80)}`);
console.log('Scenario'.padEnd(38) + 'BEFORE'.padStart(10) + 'AFTER'.padStart(10) + 'Change'.padStart(10));
console.log('-'.repeat(68));
for (let i = 0; i < before.length; i++) {
    let b = before[i].p1pct, a = after[i].p1pct;
    let delta = (b !== '—' && a !== '—') ? (parseFloat(a) - parseFloat(b)).toFixed(1) : '—';
    if (delta !== '—') delta = (parseFloat(delta) >= 0 ? '+' : '') + delta;
    console.log(before[i].name.padEnd(38) + `${b}%`.padStart(10) + `${a}%`.padStart(10) + `${delta}`.padStart(10));
}
