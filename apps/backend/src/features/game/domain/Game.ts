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

    const playerIds = Array.from(this.players.keys());
    this.turn = playerIds[0];
  }

  checkReady() {
    const players = Array.from(this.players.values());
    const allReady = players.every((p) => p.isReady);

    if (allReady && this.status === GameStatus.Placement) {
      this.resolvePreCombatInteractions(players);
      this.status = GameStatus.Combat;
      this.turnCount = 1;
    }
  }

  private resolvePreCombatInteractions(players: Player[]) {
    const [p1, p2] = players;

    // 1. Check for mines placed on the same cell (Mutual Destruction)
    const collidedMines = this.resolveMineCollisions(p1, p2);

    // 2. Trigger mines for ships placed on optional mines (Trap Check)
    this.triggerMineTraps(p1, p2, collidedMines);
    this.triggerMineTraps(p2, p1, collidedMines);
  }

  private resolveMineCollisions(p1: Player, p2: Player): { x: number; y: number }[] {
    const p1Mines = p1.placedMines;
    const p2Mines = p2.placedMines;

    const overlaps = p1Mines.filter((m1) => p2Mines.some((m2) => m2.x === m1.x && m2.y === m1.y));

    for (const ov of overlaps) {
      // Remove mines immediately to prevent other interactions
      p1.board.removeMine(ov.x, ov.y);
      p2.board.removeMine(ov.x, ov.y);

      // Trigger Explosion on P2 (Caused by P1's mine)
      this.processMineExplosion(p2, p1, ov.x, ov.y);

      // Trigger Explosion on P1 (Caused by P2's mine)
      this.processMineExplosion(p1, p2, ov.x, ov.y);

      // Explicitly mark the center as REVEALED_MINE
      p1.reveal(ov.x, ov.y, "REVEALED_MINE");
      p2.reveal(ov.x, ov.y, "REVEALED_MINE");
    }

    return overlaps;
  }

  private processMineExplosion(victim: Player, attacker: Player, x: number, y: number) {
    const blastEvents = victim.board.triggerMine(x, y);
    for (const blast of blastEvents) {
      if (blast.result === "HIT" || blast.result === "SUNK") {
        attacker.addHit(blast.x, blast.y);
      }
      attacker.reveal(
        blast.x,
        blast.y,
        (blast.result === "SUNK" ? "SUNK" : blast.result === "HIT" ? "HIT" : "MISS") as CellState
      );
    }
  }

  private triggerMineTraps(
    victim: Player,
    attacker: Player,
    collidedMines: { x: number; y: number }[]
  ) {
    // Filter out collided mines, they are already gone
    const activeAttackerMines = attacker.placedMines.filter(
      (m) => !collidedMines.some((o) => o.x === m.x && o.y === m.y)
    );

    const damageEvents = victim.checkMines(activeAttackerMines);

    for (const evt of damageEvents) {
      if (evt.result === "HIT" || evt.result === "SUNK") {
        attacker.addHit(evt.x, evt.y);
      }
      attacker.reveal(evt.x, evt.y, "REVEALED_MINE");
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

  toState(viewerId: string): GameState {
    const playersRecord: GameState["players"] = {};

    for (const [id, player] of this.players) {
      const isViewer = id === viewerId;

      const publicPlayer: PlayerState = {
        id: player.id,
        name: player.id,
        misses: player.board.getMisses(),
        hits: player.hits,
        revealedCells: player.revealedCells,
        ap: player.ap,
        isReady: player.isReady,
        isConnected: true,
        // Ships: Only show ships if it's ME, or if they are SUNK (for opponent).
        ships: isViewer
          ? player.ships
          : player.ships.map((s) => (s.isSunk ? s : { ...s, position: [] })),
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

    if (!player.spendAP(skillConfig.cost)) return false;

    const linkedShip = player.ships.find((s) => s.type === skillConfig.linkedShip);
    if (!linkedShip || linkedShip.isSunk) {
      player.ap += skillConfig.cost; // Refund AP
      return false;
    }

    const { x, y } = target || { x: 0, y: 0 };
    const strategy = SkillStrategies[skillConfig.pattern];

    if (strategy) {
      strategy(this, player, opponent, { x, y });
    } else {
      return false;
    }

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

    const outcome = opponent.receiveAttack(x, y);

    // Register Stats for Attacker
    if (outcome.attacks && outcome.attacks.length > 0) {
      for (const atk of outcome.attacks) {
        if (atk.result === "HIT" || atk.result === "SUNK") {
          player.addHit(atk.x, atk.y);
        } else if (atk.result === "MISS") {
          player.misses.push({ x: atk.x, y: atk.y });
        }
      }
    } else {
      if (outcome.result === "HIT" || outcome.result === "SUNK") {
        player.addHit(x, y);
      } else if (outcome.result === "MISS") {
        player.misses.push({ x, y });
      }
    }

    if (outcome.mineExploded) {
      player.reveal(x, y, "REVEALED_MINE");
    }

    if (opponent.hasLost()) {
      this.winner = player.id;
      this.status = GameStatus.Finished;
    } else {
      this.switchTurn();
    }

    return true;
  }
}
