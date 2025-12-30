import {
  type GameState,
  GameStatus,
  SKILLS,
  type SkillName,
  type Player as PlayerState,
  type CellState,
} from "@battle-ship/shared";
import { Player } from "./Player.js";
import { SkillStrategies } from "./SkillStrategies.js";

export class Game {
  public readonly id: string;
  public players: Map<string, Player>;
  public status: GameStatus;
  public turn: string; // Player ID
  public turnCount: number;
  public winner?: string;

  constructor(id: string) {
    this.id = id;
    this.players = new Map();
    this.status = GameStatus.Waiting;
    this.turn = "";
    this.turnCount = 0;
  }

  addPlayer(id: string): Player {
    const existingPlayer = this.players.get(id);
    if (existingPlayer) {
      return existingPlayer;
    }

    if (this.players.size >= 2) {
      throw new Error("Game is full");
    }

    const player = new Player(id);
    this.players.set(id, player);
    return player;
  }

  startGame() {
    if (this.players.size < 2) {
      throw new Error("Not enough players");
    }

    if (this.status !== GameStatus.Waiting) {
      return;
    }

    this.status = GameStatus.Placement;

    // Randomize starting turn (optional, or fixed)
    const playerIds = Array.from(this.players.keys());
    this.turn = playerIds[0]; // Simple for now
  }

  // Switch to combat when both ready
  checkReady() {
    const players = Array.from(this.players.values());
    const allReady = players.every((p) => p.isReady);

    console.log(`Game ${this.id} checkReady:`, {
      status: this.status,
      playerCount: players.length,
      players: players.map((p) => ({ id: p.id, isReady: p.isReady })),
      allReady,
    });

    if (allReady && this.status === GameStatus.Placement) {
      console.log("Transitioning to Combat!");

      // TRIGGER MINE TRAPS
      // For each player, check if their ships are on top of opponent's mines
      const p1 = players[0];
      const p2 = players[1];

      console.log("Checking Mine Traps...");

      // 0. CHECK MINE COLLISIONS (Mutual Destruction)
      const p1Mines = p1.placedMines;
      const p2Mines = p2.placedMines;

      const overlaps = p1Mines.filter((m1) => p2Mines.some((m2) => m2.x === m1.x && m2.y === m1.y));

      for (const ov of overlaps) {
        console.log(`Mine Collision at ${ov.x},${ov.y}! Mutual destruction.`);

        // Remove mines immediately to prevent other interactions
        p1.board.removeMine(ov.x, ov.y);
        p2.board.removeMine(ov.x, ov.y);

        // TRIGGER EXPLOSION ON P2 (Caused by P1's mine)
        const p2Blast = p2.board.triggerMine(ov.x, ov.y);
        for (const blast of p2Blast) {
          // Register Hit on P1's stats (P1 caused this damage)
          if (blast.result === "HIT" || blast.result === "SUNK") {
            p1.addHit(blast.x, blast.y);
          }
          // Reveal effect to P1
          p1.reveal(
            blast.x,
            blast.y,
            (blast.result === "SUNK"
              ? "SUNK"
              : blast.result === "HIT"
                ? "HIT"
                : "MISS") as CellState
          );
        }

        // TRIGGER EXPLOSION ON P1 (Caused by P2's mine)
        const p1Blast = p1.board.triggerMine(ov.x, ov.y);
        for (const blast of p1Blast) {
          // Register Hit on P2's stats
          if (blast.result === "HIT" || blast.result === "SUNK") {
            p2.addHit(blast.x, blast.y);
          }
          // Reveal effect to P2
          p2.reveal(
            blast.x,
            blast.y,
            (blast.result === "SUNK"
              ? "SUNK"
              : blast.result === "HIT"
                ? "HIT"
                : "MISS") as CellState
          );
        }

        // Explicitly mark the center as REVEALED_MINE so they know WHY it exploded
        p1.reveal(ov.x, ov.y, "REVEALED_MINE");
        p2.reveal(ov.x, ov.y, "REVEALED_MINE");
      }

      // Filter out collided mines for Trap Check
      const activeP2Mines = p2Mines.filter(
        (m) => !overlaps.some((o) => o.x === m.x && o.y === m.y)
      );
      const activeP1Mines = p1Mines.filter(
        (m) => !overlaps.some((o) => o.x === m.x && o.y === m.y)
      );

      // 1. P1 triggers P2's active mines
      const p1DamageEvents = p1.checkMines(activeP2Mines);
      for (const evt of p1DamageEvents) {
        if (evt.result === "HIT" || evt.result === "SUNK") {
          p2.addHit(evt.x, evt.y);
        }
        p2.reveal(evt.x, evt.y, "REVEALED_MINE");
      }

      // 2. P2 triggers P1's active mines
      const p2DamageEvents = p2.checkMines(activeP1Mines);
      for (const evt of p2DamageEvents) {
        if (evt.result === "HIT" || evt.result === "SUNK") {
          p1.addHit(evt.x, evt.y);
        }
        p1.reveal(evt.x, evt.y, "REVEALED_MINE");
      }

      this.status = GameStatus.Combat;
      this.turnCount = 1;
    }
  }

  switchTurn() {
    if (this.status !== GameStatus.Combat) return;

    const playerIds = Array.from(this.players.keys());
    const currentIndex = playerIds.indexOf(this.turn);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.turn = playerIds[nextIndex];

    const nextPlayer = this.players.get(this.turn);
    if (nextPlayer) {
      nextPlayer.regenerateAP();
      if (nextPlayer.id === playerIds[0]) {
        this.turnCount++;
      }
    }
  }

  // Secure Fog of War State Generation
  toState(viewerId: string): GameState {
    const playersRecord: GameState["players"] = {};

    for (const [id, player] of this.players) {
      const isViewer = id === viewerId; // Is this me?

      // Base public info
      const publicPlayer: PlayerState = {
        id: player.id,
        name: player.id,
        misses: player.board.getMisses(),
        hits: player.hits,
        revealedCells: player.revealedCells,
        ap: player.ap,
        isReady: player.isReady,
        isConnected: true,

        // SENSITIVE DATA MASKS:
        // Ships: Only show ships if it's ME, or if they are SUNK (for opponent).
        ships: isViewer
          ? player.ships
          : player.ships.map((s) => (s.isSunk ? s : { ...s, position: [] })), // Hide position of non-sunk ships

        // Mines: Only show MY mines.
        remainingMines: player.mines,
        placedMines: isViewer ? player.placedMines : [],
      };

      playersRecord[id] = publicPlayer;
    }

    return {
      id: this.id,
      status: this.status,
      players: playersRecord,
      turn: this.turn,
      turnCount: this.turnCount,
      winner: this.winner,
    };
  }

  useSkill(playerId: string, skillName: SkillName, target: { x: number; y: number }): boolean {
    if (this.status !== GameStatus.Combat || this.turn !== playerId) return false;

    const player = this.players.get(playerId);
    const opponentId = Array.from(this.players.keys()).find((id) => id !== playerId);
    const opponent = opponentId ? this.players.get(opponentId) : null;

    if (!player || !opponent) return false;

    const skillConfig = SKILLS[skillName];
    if (!skillConfig) return false;

    // Cost Validation
    if (!player.spendAP(skillConfig.cost)) return false;

    // Ship Presence Validation
    const linkedShip = player.ships.find((s) => s.type === skillConfig.linkedShip);
    if (!linkedShip || linkedShip.isSunk) {
      // Refund AP
      player.ap += skillConfig.cost;
      return false;
    }

    const { x, y } = target || { x: 0, y: 0 };
    // let affectedCells: { x: number; y: number }[] = [];

    // --- LOGIC PER SKILL (Specific) ---

    // --- STRATEGY PATTERN EXECUTION ---
    // Delegating logic to SkillStrategies to keep Entity clean
    const strategy = SkillStrategies[skillConfig.pattern];

    if (strategy) {
      strategy(this, player, opponent, { x, y });
    } else {
      console.warn(`No strategy found for Pattern: ${skillConfig.pattern}`);
      // Consider returning false or throwing, but client should prevent this.
      return false;
    }

    // Check Winner (Common logic)
    if (opponent.hasLost()) {
      this.winner = player.id;
      this.status = GameStatus.Finished;
    }

    return true;
  }
  attack(playerId: string, x: number, y: number): boolean {
    if (this.status !== GameStatus.Combat || this.turn !== playerId) return false;

    const player = this.players.get(playerId);
    const opponentId = Array.from(this.players.keys()).find((id) => id !== playerId);
    const opponent = opponentId ? this.players.get(opponentId) : null;

    if (!player || !opponent) return false;

    // Prevent attacking already resolved cells
    const currentState = opponent.board.getCellState(x, y);
    if (["HIT", "MISS", "SUNK", "REVEALED_MINE", "REVEALED_EMPTY"].includes(currentState)) {
      return false;
    }

    // Standard Attack Cost: 0 AP (Free)
    // if (!player.spendAP(1)) return false; // Removed per user request

    // Execute Attack
    const outcome = opponent.receiveAttack(x, y);
    console.log(`Attack by ${playerId} at ${x},${y}. Outcome:`, JSON.stringify(outcome));

    // Register Stats for Attacker
    // Register Stats for Attacker (Support Chain Reaction)
    if (outcome.attacks && outcome.attacks.length > 0) {
      for (const atk of outcome.attacks) {
        if (atk.result === "HIT" || atk.result === "SUNK") {
          player.addHit(atk.x, atk.y);
        } else if (atk.result === "MISS") {
          player.misses.push({ x: atk.x, y: atk.y });
        }
      }
    } else {
      // Fallback (Should not happen with new Board logic)
      if (outcome.result === "HIT" || outcome.result === "SUNK") {
        player.addHit(x, y);
      } else if (outcome.result === "MISS") {
        player.misses.push({ x, y });
      }
    }

    // Check Mine Explosion
    if (outcome.mineExploded) {
      // Reveal to Attacker that they hit a mine
      // Note: The board state is already updated (likely empty or damaged).
      // But we want to explicitly show "You hit a mine".
      // Add to revealedCells
      player.reveal(x, y, "REVEALED_MINE");
    }

    // Check Win
    if (opponent.hasLost()) {
      this.winner = player.id;
      this.status = GameStatus.Finished;
    } else {
      // Standard attack usually ends turn? Or just consumes AP?
      // If we want to allow multiple shots, we don't switch turn automatically unless AP is out?
      // Gateway logic was: game.switchTurn().
      // Let's stick to Gateway logic: 1 shot per turn?
      // But premium has AP system. If I have 6 AP, can I shoot 6 times?
      // "switchTurn" in Gateway implies 1 shot per turn.
      // BUT `ap` exists.
      // If we assume AP system, we should NOT switch turn automatically.
      // However, existing `GameGateway` switched turn.
      // Let's assume standard behavior for now: Switch turn after attack.
      // Or if using AP, maybe attacks cost 1 AP and you can keep going?
      // Let's replicate Gateway logic: switchTurn()
      this.switchTurn();
    }

    return true;
  }
}
