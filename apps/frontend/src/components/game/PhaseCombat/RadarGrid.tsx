import { type CellState, type SkillConfig } from "@battle-ship/shared";
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

    // 1. Hits
    if (enemy.ships) {
      for (const ship of enemy.ships) {
        if (ship.hits) {
          for (const h of ship.hits) {
            customStates.set(`${h.x},${h.y}`, "HIT");
          }
        }
      }
    }
    // Also include 'hits' array from player object if available
    if (enemy.hits) {
      for (const h of enemy.hits) {
        customStates.set(`${h.x},${h.y}`, "HIT");
      }
    }

    // 2. Misses
    if (enemy.misses) {
      for (const m of enemy.misses) {
        customStates.set(`${m.x},${m.y}`, "MISS");
      }
    }

    // 3. Revealed
    if (enemy.revealedCells) {
      for (const r of enemy.revealedCells) {
        // If it's already HIT/MISS, don't overwrite with REVEALED unless we want to allow seeing content of hit cells?
        // Usually HIT overrides revealed status visually, but content helps.
        // Cell component prioritizes specific state.
        // Let's rely on backend 'status' in RevealedCell which is CellState
        customStates.set(`${r.x},${r.y}`, r.status);
      }
    }

    // 4. Ghost Preview
    if (previewCenter && skillPattern && skillPattern !== "GLOBAL_RANDOM_3") {
      // const affected = getSkillAffectedCells(skillPattern, previewCenter.x, previewCenter.y);
      // Future Todo: Implement Ghost for RadarGrid using customStates or Grid prop
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
          ships={[]}
          mines={[]}
          variant="enemy"
          customStates={customStates}
          onCellClick={handleCellClick}
          onCellMouseEnter={onCellHover}
        />
      </div>
    );
  }
);
RadarGrid.displayName = "RadarGrid";
