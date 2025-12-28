import { type GameState, GameStatus, GRID_SIZE, SKILLS, type SkillName } from "@battle-ship/shared";
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

    const { x, y } = target;

    // Define simulation targets based on pattern
    const hits: { x: number; y: number }[] = [];

    if (skillConfig.pattern === "SCAN_3X3") {
      // Logic: Pick 3 random cells in 3x3 area to "Reveal" (i.e., Attack)
      const candidates: { x: number; y: number }[] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const tx = x + dx;
          const ty = y + dy;
          if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
            candidates.push({ x: tx, y: ty });
          }
        }
      }

      // Shuffle and take 3
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      hits.push(...candidates.slice(0, 3));
    } else if (skillConfig.pattern === "CROSS_5") {
      // Logic: Cross Pattern (Center + 4 adjacent)
      const offsets = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      for (const o of offsets) {
        const tx = x + o.dx;
        const ty = y + o.dy;
        if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
          hits.push({ x: tx, y: ty });
        }
      }
    }

    // Execute Attacks
    for (const h of hits) {
      opponent.receiveAttack(h.x, h.y);
    }

    return true;
  }
}
