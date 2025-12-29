import { Cell } from "../Cell/Cell";
import { type CellState, type Coordinates, GRID_SIZE } from "@battle-ship/shared";
import { useGame } from "../../../hooks/useGame";
import { useUser } from "../../../context/UserContext";
import styles from "../Grid/Grid.module.scss";
import clsx from "clsx";

// Reusing Grid styles for consistency, but we might want specific RADAR styles.
import { forwardRef } from "react";
import { type SkillConfig, getSkillAffectedCells } from "@battle-ship/shared";

type RadarGridProps = {
  onAttackOverride?: (x: number, y: number) => void;
  previewCenter?: { x: number; y: number } | null;
  skillPattern?: SkillConfig["pattern"];
  onCellHover?: (x: number, y: number) => void;
};

export const RadarGrid = forwardRef<HTMLDivElement, RadarGridProps>(
  ({ onAttackOverride, previewCenter, skillPattern, onCellHover }, ref) => {
    const { gameState, playerId, actions } = useGame();
    // const { playerName } = useUser(); // Unused

    if (!gameState || !playerId) return null;

    // Identify Enemy
    const enemyId = Object.keys(gameState.players).find((p) => p !== playerId);
    const enemy = enemyId ? gameState.players[enemyId] : null;

    if (!enemy) return <div className={styles.stateMessage}>Esperando enemigo...</div>;

    const hits: Coordinates[] = [];
    if (enemy.ships) {
      for (const ship of enemy.ships) {
        if (ship.hits) {
          hits.push(...ship.hits);
        }
      }
    }

    const misses = enemy.misses || [];
    const revealed = enemy.revealedCells || [];

    const isHit = (x: number, y: number) => hits.some((h) => h.x === x && h.y === y);
    const isMiss = (x: number, y: number) => misses.some((m) => m.x === x && m.y === y);
    const isRevealed = (x: number, y: number) => revealed.some((r) => r.x === x && r.y === y);

    // Ghost Calculation
    const ghostCells: Coordinates[] = [];
    if (previewCenter && skillPattern) {
      // Only show ghost for directed skills
      if (skillPattern !== "GLOBAL_RANDOM_3") {
        const affected = getSkillAffectedCells(skillPattern, previewCenter.x, previewCenter.y);
        ghostCells.push(...affected);
      }
    }
    const isGhost = (x: number, y: number) => ghostCells.some((g) => g.x === x && g.y === y);

    const onCellClick = (x: number, y: number) => {
      if (gameState.turn !== playerId) return;

      if (onAttackOverride) {
        onAttackOverride(x, y);
        return;
      }

      if (isHit(x, y) || isMiss(x, y)) return;

      actions.attack(x, y);
    };

    const renderCells = () => {
      const cells: JSX.Element[] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          let state: CellState = "EMPTY";
          // Priority: HIT/MISS > REVEALED > EMPTY
          if (isHit(x, y)) state = "HIT";
          else if (isMiss(x, y)) state = "MISS";
          else if (isRevealed(x, y)) {
            // Check if it's a ship
            const isShip = enemy.ships?.some((s) => s.position.some((p) => p.x === x && p.y === y));

            state = isShip ? "REVEALED_SHIP" : "REVEALED_EMPTY";
          }

          // Check Ghost
          const ghost = isGhost(x, y);

          cells.push(
            <Cell
              key={`${x}-${y}`}
              x={x}
              y={y}
              state={state}
              isGhost={ghost}
              onClick={(gx: number, gy: number) => onCellClick(gx, gy)}
              onMouseEnter={() => onCellHover?.(x, y)}
            />
          );
        }
      }
      return cells;
    };

    return (
      <div className={styles.container}>
        <div className={styles.gridWrapper}>
          <div ref={ref} className={clsx(styles.grid, styles.enemy, styles.radarGrid)}>
            {renderCells()}
          </div>
        </div>
      </div>
    );
  }
);

RadarGrid.displayName = "RadarGrid";
