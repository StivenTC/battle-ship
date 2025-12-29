import {
  type GameState,
  GameStatus,
  GRID_SIZE,
  SKILLS,
  type SkillName,
  getSkillAffectedCells,
} from "@battle-ship/shared";
import { Player } from "./Player.js";

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
      p1.checkMines(p2.placedMines);
      p2.checkMines(p1.placedMines);

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

  toState(): GameState {
    const playersRecord: GameState["players"] = {};
    for (const [id, player] of this.players) {
      playersRecord[id] = {
        id: player.id,
        name: player.id, // Placeholder
        ships: player.ships,
        remainingMines: player.mines,
        placedMines: player.placedMines,
        misses: player.board.getMisses(),
        revealedCells: player.revealedCells,
        ap: player.ap,
        isReady: player.isReady,
        isConnected: true,
      };
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
      // Refund if strict check failed?
      // Or client should prevent this.
      // Let's assume client prevents?
      // Strict: return false and refund cost if you want robust.
      // For now, let's just allow it or assume client side checks are mostly OK, but backend enforces rule.
      // Refund AP
      player.ap += skillConfig.cost;
      return false;
    }

    const { x, y } = target || { x: 0, y: 0 };
    let affectedCells: { x: number; y: number }[] = [];

    // --- LOGIC PER SKILL (Specific) ---

    if (skillConfig.pattern === "SCAN_3X3") {
      // Logic: REVEAL ONLY (No attack)
      // 3x3 Center at X,Y
      affectedCells = getSkillAffectedCells("SCAN_3X3", x, y);
      for (const cell of affectedCells) {
        opponent.reveal(cell.x, cell.y);
      }
      return true;
    }

    if (skillConfig.pattern === "CROSS_DIAGONAL") {
      // Logic: Damage Center + 4 Diags
      affectedCells = getSkillAffectedCells("CROSS_DIAGONAL", x, y);
      // Fallthrough to ATTACK
    } else if (skillConfig.pattern === "GLOBAL_RANDOM_3") {
      // Chaotic Salvo: 3 Random shots on valid coords
      const available: { x: number; y: number }[] = [];
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          available.push({ x: i, y: j });
        }
      }
      // Shuffle
      for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
      }
      affectedCells = available.slice(0, 3);
      affectedCells = available.slice(0, 3);
    } else if (skillConfig.pattern === "LINE_RAY") {
      // Sonar Torpedo: Vertical Bottom-Up
      // Starts at y=9, goes to y=0 of the target column x
      for (let i = GRID_SIZE - 1; i >= 0; i--) {
        const currentY = i;
        affectedCells.push({ x, y: currentY });

        const state = opponent.board.getCellState(x, currentY);
        // Stop if we hit a ship (unrevealed or already hit)
        // Note: REVEALED_SHIP is also a ship conceptually, so we should stop.
        // But for now check SHIP/HIT. If state is "REVEALED_SHIP" (if logic allows it), it should also stop.
        // Assuming GetCellState returns basic types or we handle new ones.
        // Opponent Board getCellState might return explicit types?
        if (state === "SHIP") {
          break;
        }
        // Also stop if we hit a mine (it should be triggered)
        const hasMine = opponent.placedMines.some((m) => m.x === x && m.y === currentY);
        if (hasMine) {
          break;
        }
      }
    } else if (skillConfig.pattern === "SINGLE_REVEAL") {
      // Revealing Shot: 1x1 Damage.
      // If IS SHIP -> Reveal All.
      affectedCells.push({ x, y });

      // Check if hit a ship to trigger Reveal
      const state = opponent.board.getCellState(x, y);
      if (state === "SHIP") {
        // Find which ship was hit
        // We can scan opponent ships to see which one contains x,y
        const hitShip = opponent.ships.find((s) => s.position.some((p) => p.x === x && p.y === y));
        if (hitShip) {
          // Reveal all positions
          for (const p of hitShip.position) opponent.reveal(p.x, p.y);
        }
      }
    }

    // Execute Attacks (Damage)
    for (const h of affectedCells) {
      opponent.receiveAttack(h.x, h.y);
    }

    // Check Winner
    if (opponent.hasLost()) {
      this.winner = player.id;
      this.status = GameStatus.Finished;
    }

    return true;
  }
}
