import { type CellState, type SkillConfig, getSkillAffectedCells } from "@battle-ship/shared";
import { useGame } from "../../../hooks/useGame";
import { Grid } from "../Grid/Grid";
import { forwardRef } from "react";
import styles from "../Grid/Grid.module.scss";

type RadarGridProps = {
  onAttackOverride?: (x: number, y: number) => void;
  previewCenter?: { x: number; y: number } | null;
  skillPattern?: SkillConfig["pattern"];
  onCellHover?: (x: number, y: number) => void;
};

export const RadarGrid = forwardRef<HTMLDivElement, RadarGridProps>(
  ({ onAttackOverride, previewCenter, skillPattern, onCellHover }, ref) => {
    const { gameState, playerId, actions } = useGame();

    if (!gameState || !playerId) return null;

    const enemyId = Object.keys(gameState.players).find((p) => p !== playerId);
    const enemy = enemyId ? gameState.players[enemyId] : null;

    if (!enemy) return <div className={styles.stateMessage}>Esperando enemigo...</div>;

    // Build Custom State Map
    const customStates = new Map<string, CellState>();

    const myPlayer = gameState && playerId ? gameState.players[playerId] : null;

    // 1. Misses (What *I* missed -> Holes on Enemy Board) - Base Layer
    // We use enemy.misses (Incoming on Enemy)
    if (enemy?.misses) {
      for (const m of enemy.misses) {
        customStates.set(`${m.x},${m.y}`, "MISS");
      }
    }

    // 2. Revealed (My Intel) - Overrides Misses (e.g. Revealed Mine)
    // We use myPlayer.revealedCells (My intel)
    if (myPlayer?.revealedCells) {
      for (const r of myPlayer.revealedCells) {
        customStates.set(`${r.x},${r.y}`, r.status);
      }
    }

    // 3. Hits (What *I* hit on the enemy) - Overrides Revealed & Hits
    // We use myPlayer.hits (Outgoing)
    if (myPlayer?.hits) {
      for (const h of myPlayer.hits) {
        customStates.set(`${h.x},${h.y}`, "HIT");
      }
    }

    // 4. Sunk Ships (Ultimate Feedback) - Overrides everything
    // Only sunk ships are sent in the 'enemy.ships' array due to Fog of War.
    if (enemy?.ships) {
      for (const s of enemy.ships) {
        if (s.isSunk) {
          // Should be true if present, but double check
          for (const pos of s.position) {
            customStates.set(`${pos.x},${pos.y}`, "SUNK");
          }
        }
      }
    }

    // 4. Ghost Preview
    const ghostCells = new Set<string>();
    if (previewCenter && skillPattern) {
      const affected = getSkillAffectedCells(skillPattern, previewCenter.x, previewCenter.y);
      for (const cell of affected) {
        ghostCells.add(`${cell.x},${cell.y}`);
      }
    }

    // Handling Click
    const handleCellClick = (x: number, y: number) => {
      if (gameState.turn !== playerId) return;
      if (onAttackOverride) {
        onAttackOverride(x, y);
        return;
      }
      // Basic check if already acted
      if (customStates.get(`${x},${y}`) === "HIT" || customStates.get(`${x},${y}`) === "MISS")
        return;
      actions.attack(x, y);
    };

    return (
      <div ref={ref}>
        <Grid
          ships={enemy?.ships || []}
          mines={[]}
          variant="enemy"
          customStates={customStates}
          ghostCells={ghostCells}
          onCellClick={handleCellClick}
          onCellMouseEnter={onCellHover}
        />
      </div>
    );
  }
);
RadarGrid.displayName = "RadarGrid";
