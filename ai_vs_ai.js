// AI vs AI harness for strategos.html
// Runs Hard AI vs Hard AI many times and reports win/loss/draw rates.
// Usage: node ai_vs_ai.js [numMatches]
//
// Strategy: the in-game AI is hardcoded to operate on P2. To play P1's turn
// we flip every unit's player field (1↔2) and swap p1Units/p2Units, call
// aiPlan() (which plans "P2"), then flip and swap back. Board geometry is
// untouched; only player labels change.

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'strategos.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');
const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
const lastScript = scriptMatches[scriptMatches.length - 1].replace(/<\/?script[^>]*>/g, '');

// ---------- DOM / browser mocks ----------
const mockCtx = new Proxy({}, { get: () => () => ({}) });
const mockCanvas = {
    getContext: () => mockCtx,
    addEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 720, height: 1080 }),
    style: {},
    width: 720,
    height: 1080,
};
global.window = { addEventListener: () => {}, __resetGame: false };
global.document = {
    getElementById: () => mockCanvas,
    addEventListener: () => {},
    createElement: () => ({ getContext: () => mockCtx, style: {}, width: 0, height: 0 }),
    body: { appendChild: () => {} },
};
global.Image = class {
    constructor() { this.complete = true; this.naturalWidth = 32; this._src = ''; }
    set src(v) { this._src = v; }
    get src() { return this._src; }
};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => 0;
global.setTimeout = setTimeout;
global.Peer = function () {};

// ---------- load the game ----------
let src = lastScript;
src += `
global.Game = Game;
global.Unit = Unit;
global.STATS = STATS;
global.ROWS = ROWS;
global.COLS = COLS;
global.P1_ZONE = P1_ZONE;
global.P2_ZONE = P2_ZONE;
global.INVESTED = INVESTED;
global.MAX_ROSTER = MAX_ROSTER;
global.L1_UNITS = L1_UNITS;
`;
try { eval(src); }
catch (e) { console.error('Script eval failed:', e.message); process.exit(1); }

// ---------- helpers ----------

// Flip player labels + swap arrays so that whichever side is "really" P1
// ends up being processed as P2 by the P2-hardcoded AI planner.
function flipAndSwap(g) {
    for (let u of [...g.p1Units, ...g.p2Units]) {
        u.player = 3 - u.player;
        u.facing = [-u.facing[0], -u.facing[1]];
    }
    const tmp = g.p1Units;
    g.p1Units = g.p2Units;
    g.p2Units = tmp;
}

// Mirror the Hard-difficulty aiPlace layout but for P1_ZONE.
// aiPlace (hard) puts melee on the front row (zone[0] for P2 = row 3, the
// one adjacent to the midfield) and ranged on the back row (zone[1] for P2
// = row 4). For P1, the front row (closer to enemy) is P1_ZONE[1] = row 1
// and the back row is P1_ZONE[0] = row 0.
function placeP1Hard(g) {
    const zone = P1_ZONE;
    const positions = [];
    for (let r = zone[0]; r <= zone[1]; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!g.getUnitAt(r, c)) positions.push([r, c]);
        }
    }
    const front = positions.filter(([r]) => r === zone[1]); // row 1
    const back  = positions.filter(([r]) => r === zone[0]); // row 0
    const melee  = g.p1Units.filter(u => STATS[u.type].rng === 1);
    const ranged = g.p1Units.filter(u => STATS[u.type].rng > 1);
    for (const u of melee) {
        const pos = front.length ? front.shift() : (back.length ? back.shift() : positions.shift());
        if (pos) { u.r = pos[0]; u.c = pos[1]; }
    }
    for (const u of ranged) {
        const pos = back.length ? back.shift() : (front.length ? front.shift() : positions.shift());
        if (pos) { u.r = pos[0]; u.c = pos[1]; }
    }
}

// Reset planned fields before each plan phase. We pre-seed plannedR/plannedC
// to the unit's current position so that resolveArrowPath / resolveFireboltPath
// (which use getPlannedUnitAt, not getUnitAt) can still find enemies that the
// opposing planner hasn't committed moves for yet. Without this seed, whichever
// side plans FIRST has no targets for its ranged/magic units and sets no attack.
function clearPlans(units) {
    for (const u of units) {
        u.plannedR = u.r;
        u.plannedC = u.c;
        u.plannedAtk = null;
        u.plannedTrap = null;
        u.plannedBeacon = null;
        u.plannedAid = null;
        u.plannedStealth = false;
        u.plannedShadow = null;
        u.plannedChannel = false;
        u.plannedRain = null;
        u.plannedBlink = null;
        u.ordered = false;
    }
}

// Run one match from a fresh game state. Returns 1/2/3 (P1/P2/draw) or 0 for error.
function runMatch(budget = 8, turnCap = 30) {
    const g = new Game();
    g.gameMode = 'AI';
    g.difficulty = 'Hard';
    g.budget = budget;
    g.cullingTurn = 10;
    g.phase = 'MENU';
    g.initBoard();

    // --- Shop: build P2 then copy over to P1 (with player=1), then build a fresh P2 ---
    g.aiShop();                           // fills p2Units
    g.p1Units = g.p2Units.map(u => new Unit(1, u.type));
    g.p2Units = [];
    g.aiShop();                           // fills a new p2Units

    if (g.p1Units.length === 0 || g.p2Units.length === 0) return 0;

    // --- Place: P2 uses built-in, P1 uses mirrored helper ---
    g.aiPlace();                          // places P2 at rows 3-4
    placeP1Hard(g);                       // places P1 at rows 0-1

    // --- Turn loop ---
    for (let turn = 0; turn < turnCap; turn++) {
        // FAIR-PLAY PLANNING: both sides must plan with symmetric info. If we
        // naively did P2 first then P1, P1 would be able to scan for P2's
        // already-committed moves (via getPlannedUnitAt in the arrow/firebolt
        // resolvers) — a huge informational advantage for ranged units.
        //
        // Instead: plan P2 first with enemies pre-seeded to current positions,
        // snapshot P2's plans, reset everything to current positions, plan P1
        // with a clean slate, then restore P2's plans.
        clearPlans(g.p1Units);
        clearPlans(g.p2Units);

        g.aiPlan();
        const p2Snapshot = g.p2Units.map(u => ({
            plannedR: u.plannedR, plannedC: u.plannedC, plannedAtk: u.plannedAtk,
            plannedTrap: u.plannedTrap, plannedBeacon: u.plannedBeacon, plannedAid: u.plannedAid,
            plannedStealth: u.plannedStealth, plannedShadow: u.plannedShadow,
            plannedChannel: u.plannedChannel, plannedRain: u.plannedRain,
            plannedBlink: u.plannedBlink, ordered: u.ordered,
        }));

        // Reset both sides so P1 sees P2 at current positions (symmetry)
        clearPlans(g.p1Units);
        clearPlans(g.p2Units);

        flipAndSwap(g);
        g.aiPlan();
        flipAndSwap(g);

        // Restore P2's plans
        g.p2Units.forEach((u, i) => Object.assign(u, p2Snapshot[i]));

        g.resolveAction();
        const result = g.getGameOver();
        if (result !== 0) return result;
    }
    return 3;
}

// ---------- main ----------
const N = parseInt(process.argv[2] || '1000', 10);
const BUDGET = parseInt(process.argv[3] || '8', 10);

console.log(`Running ${N} Hard vs Hard matches at budget ${BUDGET}...`);
const t0 = Date.now();
let tally = { p1: 0, p2: 0, draw: 0, error: 0 };
let errors = [];

for (let i = 0; i < N; i++) {
    try {
        const r = runMatch(BUDGET, 30);
        if (r === 1) tally.p1++;
        else if (r === 2) tally.p2++;
        else if (r === 3) tally.draw++;
        else tally.error++;
    } catch (e) {
        tally.error++;
        if (errors.length < 5) errors.push(e.message);
    }
    if ((i + 1) % 100 === 0) {
        const elapsed = (Date.now() - t0) / 1000;
        const rate = (i + 1) / elapsed;
        console.log(`  ${i + 1}/${N}  (${rate.toFixed(1)} matches/s)  p1=${tally.p1} p2=${tally.p2} draw=${tally.draw} err=${tally.error}`);
    }
}

const elapsed = (Date.now() - t0) / 1000;
console.log('');
console.log('=== RESULTS ===');
console.log(`Total matches: ${N}  (in ${elapsed.toFixed(1)}s, ${(N / elapsed).toFixed(1)}/s)`);
console.log(`P1 wins:  ${tally.p1}  (${(100 * tally.p1 / N).toFixed(1)}%)`);
console.log(`P2 wins:  ${tally.p2}  (${(100 * tally.p2 / N).toFixed(1)}%)`);
console.log(`Draws:    ${tally.draw}  (${(100 * tally.draw / N).toFixed(1)}%)`);
console.log(`Errors:   ${tally.error}  (${(100 * tally.error / N).toFixed(1)}%)`);
const decided = tally.p1 + tally.p2;
if (decided > 0) {
    console.log('');
    console.log(`Of decided matches: P1 ${(100 * tally.p1 / decided).toFixed(1)}%  /  P2 ${(100 * tally.p2 / decided).toFixed(1)}%`);
}
if (errors.length) {
    console.log('');
    console.log('First few errors:');
    for (const e of errors) console.log('  ' + e);
}
