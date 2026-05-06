# Strategos — Resolution Phase Rulebook

## How Combat Resolves

When both players lock in their plans, the turn resolves. All outcomes are computed simultaneously — no unit acts "before" another in the game logic. However, the results are **played back** in cinematic phases so you can follow the action clearly.

Think of it like a chess clock striking midnight: everything happens at once in the story, but the camera shows you each piece of the action in sequence.

---

## The Phases

Every turn plays out in this order:

```
PHASE 1 ─── Safe Movers
    │
    ├── [2 second pause]
    │
PHASE 2 ─── Lambs (units about to take damage)
    │
    ├── [2 second pause]
    │
PHASE 3 ─── Brawlers (units that deal AND take damage)
    │
    ├── [2 second pause]
    │
PHASE 4 ─── Untouched Strikers (units that deal damage safely)
    │
    ├── [2 second pause]
    │
FINALE ──── Big dramatic hits
    │
    ├── [2 second pause]  (Turn 10+ only)
    │
THE WEAVER ─ Attrition damage (Turn 10+ only)
    │
TURN END ── Inspect results, then continue
```

If a phase has no units, it is **skipped** — but a brief double-beat pulse (like a heartbeat) plays to signal the empty phase passed. This maintains the rhythm.

---

## Phase 1 — Safe Movers

**Who belongs here:** Units that move (or stay still) and neither deal nor receive damage this turn.

This includes:
- Units walking to a new tile with no consequence
- Units holding position with no planned action
- Assassins going invisible (vanish)
- Archmages blinking (teleporting)
- Archmages channeling (building power)
- Units placing traps or beacons
- Units that bounced but took no damage

**How it plays:** All Phase 1 units animate **simultaneously** by default. Everyone slides to their destination (or holds position) at the same time. Bounce animations (slide out, bounce back) play here for bounced-but-unhurt units. Squeeze kills from bounces are immediate — the crushed unit topples during this phase.

**Why it's first:** These units aren't involved in any conflict. Get them out of the way so the camera can focus on the action.

---

## Phase 2 — Lambs

**Who belongs here:** Units that receive damage but deal NO damage this turn.

This includes:
- A unit that walked into an archer's firing lane and gets shot
- A unit that walked onto a trap and was killed (Sunder — see below)
- A unit that charged into a readied shot and was killed (Sunder)
- A stationary unit that gets hit by ranged fire without fighting back

**How it plays:** Each unit is animated **individually** with slight time offsets. Stationary lambs get a brief "holding position" pause to show their choice was intentional.

**The Danger Glow:** When a Phase 2 unit arrives at its destination, it gains a persistent glow indicating incoming danger. This glow remains until the actual damage lands (in Phase 3 or Phase 4), at which point it "pops" into a floating damage number.

**Movement Consequences:** If a unit's movement triggers a defensive reaction, that reaction plays during the movement animation:
- Walking onto a trap → explosion plays mid-step
- Charging into readied shot range → arrow fires as the unit arrives
- Being trampled by a charger → damage flash as the charger passes

If any of these kills the unit, it's a **Sunder** (see below) — death is immediate.

---

## Phase 3 — Brawlers

**Who belongs here:** Units that BOTH deal and receive damage this turn. The fighters in the thick of it.

**How it plays:** Each unit is animated individually. The phase has internal structure:

### Phase 3 Internal Order

**Step 1 — Brawler Movement**
Each brawler moves to its destination (with movement consequences: trample, readied shot, traps). Movement consequences can Sunder a brawler during this step.

**Step 2 — Brawlers Hit Lambs**
Phase 3 units deal their damage to Phase 2 units first. The lambs' danger glow pops into damage numbers.

**Step 3 — Brawler-on-Brawler (Non-Lethal)**
Damage between brawlers that doesn't kill. The camera jumps from character to character. All incoming damage on one character plays in **rapid sub-beats** (quick succession, like drum hits). Characters taking fewer hits resolve first (simpler exchanges before complex ones).

**Step 4 — Brawler-on-Brawler (Death Blows)**
Hits that bring a unit to 0 HP. The dying unit still gets its own attack BEFORE its death animation plays (see "Near Death" below). Characters taking death blows are animated last.

**Step 5 — Mutual Kills**
If two brawlers kill each other, their hits land **simultaneously** as a final dramatic exchange. Both death animations play together.

### The 0 HP Rule

A unit reduced to 0 HP in combat (not Sundered) still gets to execute its planned attack before dying. Sequence:
1. Unit takes lethal hit
2. Unit enters "near death" state (visually staggering/flickering)
3. Unit executes its own attack
4. Unit's death animation plays

This does NOT apply to Sunders (traps, readied shots, trample, squeeze, the Weaver). Sundered units die immediately.

---

## Phase 4 — Untouched Strikers

**Who belongs here:** Units that deal damage but take NO damage this turn.

This includes:
- Archers sniping from safe range
- Mages casting from the back line
- Any unit whose attack lands without retaliation
- Knights/Paladins using Lend Aid (healing counts as an "attack" for phase sorting)

**How it plays:** Each unit gets a **two-beat** moment:
- **Beat 1:** Unit moves to position (or holds position)
- **Beat 2:** Attack animation plays — arrows fly, firebolts streak, heals glow

For Lend Aid: green "+2" floats above the healed ally instead of red damage.

Death blows within Phase 4 go last (non-lethal hits resolve first).

---

## The Finale

**Who belongs here:** Attacks that are too dramatic for normal phase resolution. These ALWAYS play last, regardless of which phase the attacking unit belongs to for movement purposes.

### Finale Attacks

| Attack | Why it's a Finale |
|--------|-------------------|
| Knight/Paladin Charge (2x damage) | Momentum — the full weight of a mounted charge |
| Archmage Rain Fire | A 3-turn channel unleashing devastating area damage |
| Assassin Shadow Strike | A backstab instant kill from stealth |
| Beacon Mark (Archer 3x) | Multi-turn setup: Adept marks, Archer executes |
| Arcing Firebolt (2.5x center) | Two mages converging fire on one point |
| Volley (coordinated Archer fire) | Two Archers in synchronized formation |

### How Finales Play

The attacking unit already moved to its position in an earlier phase (Phase 3 or 4). In the Finale, only the **damage effect** plays — the big impact, the rain of fire, the assassination strike.

**Order:** Finales are sorted by **total damage dealt** (ascending). Smallest hit plays first, building to the most devastating. Shadow Strike (instant kill = infinite damage) is always truly last.

If multiple finales deal the same damage, order is arbitrary.

### Finale + Movement

A unit's movement happens in its normal phase:
- Paladin that charges AND takes damage → moves in Phase 3, charge damage in Finale
- Assassin that shadow strikes without taking damage → moves in Phase 4, kill in Finale

The unit is already at its final position by the time the Finale plays. The camera just shows the impact.

---

## The Weaver (Turn 10+)

Starting on turn 10, **The Weaver** drains the life from all surviving units at the end of each turn. Every unit loses **ceil(25% of current HP)**. This prevents infinite stalemates.

**When it plays:** After the Finale. It's the closing beat of the turn — the battlefield itself is consuming you.

**Visual:** All surviving units shudder simultaneously. Damage numbers rise. Any unit reduced to 0 HP topples.

**This is NOT a Sunder.** All units got to act this turn. The Weaver kills them going into the next turn. If a unit dies to the Weaver, it simply won't be there for the next turn's planning phase.

---

## Sunder — Immediate Death

**Sunder** is the term for when a unit is killed before it gets to execute its planned action. Sundered units die immediately — no "near death" state, no final attack.

### What Causes Sunder

| Cause | When it Happens |
|-------|-----------------|
| Trap Detonation (lethal) | Unit walks onto trap during movement |
| Readied Shot (lethal) | Archer auto-fires at arriving heavy unit, killing it |
| Trample (lethal) | Charger passes through mid-tile, killing occupant |
| Squeeze | Unit bounced into a tile occupied by a friendly — crushed |

### What Sunder Means

- The unit's planned attack is **cancelled** — it never fires
- Death animation plays **immediately** during the movement phase
- No "near death" staggering — the unit is simply destroyed
- The unit was intercepted before executing its orders

### What is NOT a Sunder

- Being killed in Phase 3/4 combat (you still get your attack first)
- Being killed in the Finale (you already acted in your phase)
- The Weaver's attrition (you already acted this turn)

---

## Near Death State

When a unit is reduced to 0 HP by combat damage (NOT Sundered), it enters a **near death** state:

- **Visual:** Unit staggers, flickers, or sparks — clearly wounded but still standing
- **Purpose:** The unit gets to execute its planned attack before dying
- **Duration:** The unit remains in near death until its attack plays AND all remaining incoming damage (from later phases) has been shown
- **Death Animation:** Plays after the last hit on the unit from any phase

### Why This Exists

If a unit takes damage from BOTH a Phase 3 brawler and a Phase 4 striker, the unit enters near death after the Phase 3 hit. It stays upright through Phase 4, takes the additional hit, THEN topples. This prevents the awkward visual of shooting a corpse — the Phase 4 attack becomes the visible finishing blow.

**Overkill damage** (damage beyond 0 HP) is tracked for a future scoring metric.

---

## Movement Consequences

These effects trigger as part of a unit's movement animation — they are NOT separate attacks in their own phase.

### Readied Shot
- **Trigger:** A weight-3 unit (Knight/Paladin) ends its movement adjacent to an Archer
- **Visual:** Arrow fires the instant the heavy unit arrives
- **If lethal:** Sunder — the heavy unit dies on arrival, attack cancelled

### Trample
- **Trigger:** A Knight/Paladin completes a 2-tile charge, passing through an occupied mid-tile
- **Visual:** Damage flash on the mid-tile unit as the charger passes through
- **If lethal:** Sunder — the trampled unit dies, attack cancelled

### Trap Detonation
- **Trigger:** A unit ends on (or a charger passes through) a trap tile
- **Visual:** Explosion plays during movement. Splash damage to adjacent tiles.
- **If lethal:** Sunder — the unit dies mid-step, attack cancelled
- **Charger special:** A charger hitting a trap mid-charge is stopped on the trap tile (momentum broken by explosion)

### Squeeze
- **Trigger:** A bounced unit's origin tile is occupied by a friendly unit that successfully moved there
- **Visual:** Unit slides back, finds no room, is crushed
- **If lethal:** Sunder (always lethal) — immediate death, attack cancelled

---

## Whiffed Attacks (Bounce Recovery)

When a unit is bounced back to its origin and its planned attack can no longer reach a valid target, the attack **whiffs**.

**Visual:** Instead of a full attack animation, a shortened/fizzled effect plays:
- Firebolt sparks out after 1 tile
- Arrow thuds into the ground
- Melee swing hits air

This communicates "the plan failed due to movement" rather than looking like a bug. The game is about movement strategy — getting bounced has consequences.

---

## Stacking Buff Indicators

Certain abilities grow stronger when a unit holds position across multiple turns. These stacks are visible to **BOTH players** at all times.

### Accuracy (Archer)
- **How it stacks:** Archer doesn't move AND fires at the same target tile on consecutive turns
- **Max stacks:** 3 (each stack = +50% damage)
- **Rune:** Crosshair / eye symbol hovering above the Archer
  - Stack 1: Faint amber glow, simple shape
  - Stack 2: Brighter, more intricate strokes
  - Stack 3: Hot white, complex/ornate design

### Focused Channeling (Adept)
- **How it stacks:** Adept doesn't move on consecutive turns
- **Max stacks:** 5 (each stack = +1 flat magic damage)
- **Rune:** Spiral / flame symbol hovering above the Adept
  - Stacks 1-5: Progressive intensity and visual complexity

### Cascading Damage Numbers

When a stacked attack lands, damage is shown as **multiple rising numbers** rather than one combined total:

```
     -3   -3      ← stack bonuses (slightly delayed)
       -6          ← base damage (appears first)
    ─────────
    [ target ]
```

Each number rises in quick sequence, making the amplification visible. You can see exactly how much of the damage came from stacking.

---

## Synergy Pre-Positioning

**Volley** (two Archers) and **Arcing Firebolt** (two Mages) require the participating units to be **already in position** — they cannot move on the turn they activate the synergy.

### Why This Matters

- You must spend a turn moving units into formation BEFORE activating the synergy
- This telegraphs your intent to your opponent — they can see two Archers side by side and anticipate a Volley
- This adds counterplay: disrupt the formation before it fires
- Both synergies are Finale attacks (always play last)

### Synergies NOT Affected

These synergies work even if units moved this turn:
- **Flame Arrow** (Archer + Adept targeting same tile)
- **Anvil & Hammer** (Archer firing at enemy adjacent to friendly Squire)
- **Steady Aim** (Archer with Squire shielding the firing lane)

These involve different unit roles in incidental positioning, not coordinated same-class formations.

---

## Animation Speed

A speed slider is available in game settings (set before match start for PvP):

| Setting | Phase Delay | Description |
|---------|-------------|-------------|
| Slow | 3 seconds | Full cinematic experience — savor every moment |
| Normal | 2 seconds | Default — clear and readable |
| Fast | 1 second | Experienced players who know what to watch for |
| Instant | 0 seconds | Skip all phasing — replicate the old simultaneous view |

The slider adjusts:
- Time between phases
- Movement animation duration
- Sub-beat timing within Phase 3
- Finale dramatic pauses

---

## Quick Reference — Unit Classification

After all outcomes are computed, each unit is classified:

| Takes Damage? | Deals Damage? | Phase |
|:---:|:---:|:---:|
| No | No | **Phase 1** — Safe Mover |
| Yes | No | **Phase 2** — Lamb |
| Yes | Yes | **Phase 3** — Brawler |
| No | Yes | **Phase 4** — Untouched Striker |

**Special rules:**
- Lend Aid (healing) counts as "dealing damage" for classification
- Defensive reactions (readied shot) do NOT count — they're automatic
- Finale attacks: the unit moves in its classified phase, damage deferred to Finale

---

## Quick Reference — Sunder vs. Near Death vs. The Weaver

| | Sunder | Near Death | The Weaver |
|---|---|---|---|
| **When** | During movement | During combat (Phase 3/4/Finale) | End of turn (Turn 10+) |
| **Gets to attack?** | NO — action cancelled | YES — attacks before dying | Already acted |
| **Death timing** | Immediate | After last hit received | After Weaver damage |
| **Causes** | Trap, readied shot, trample, squeeze | Normal combat damage | Attrition |

---

## Design Principles

1. **Movement is strategy.** Getting bounced whiffs your attack. Walking into a trap Sunders you. Positioning for synergies costs a turn. Every tile matters.

2. **Build anticipation.** Phases escalate — safe moves, then danger, then brawling, then precision strikes, then the big finish. Each phase raises stakes.

3. **Reward attention.** Stacking runes visible to both players. Danger glows on lambs. The double-beat pulse for empty phases. Players who read the board are rewarded.

4. **Drama goes last.** Finales always cap the turn. Death blows go last within phases. The biggest hit in the Finale plays last. Build to the climax.

5. **Clarity over speed.** Every unit gets its moment. Movement consequences play during movement. Damage cascades show the math. Nothing happens off-screen.
