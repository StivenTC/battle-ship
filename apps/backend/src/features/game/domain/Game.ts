import {
  type GameState,
  GameStatus,
  SKILLS,
  type SkillName,
  type Player as PlayerState,
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

    // Standard Attack Cost: 1 AP
    if (!player.spendAP(1)) return false;

    // Execute Attack
    const outcome = opponent.receiveAttack(x, y);

    // Register Stats for Attacker
    if (outcome.result === "HIT" || outcome.result === "SUNK") {
      player.addHit(x, y);
    } else if (outcome.result === "MISS") {
      player.misses.push({ x, y });
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
