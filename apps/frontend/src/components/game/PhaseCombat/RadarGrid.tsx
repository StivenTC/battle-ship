import { Cell } from "../Cell/Cell";
import { type Coordinates, GRID_SIZE } from "@battle-ship/shared";
import { useGame } from "../../../hooks/useGame";
import { useUser } from "../../../context/UserContext";
import styles from "../Grid/Grid.module.scss";
import clsx from "clsx";

// Reusing Grid styles for consistency, but we might want specific RADAR styles.

type RadarGridProps = {
  onAttackOverride?: (x: number, y: number) => void;
};

export const RadarGrid = ({ onAttackOverride }: RadarGridProps) => {
  const { gameState, playerId, actions } = useGame();
  const { playerName } = useUser();

  if (!gameState || !playerId) return null;

  // Identify Enemy
  const enemyId = Object.keys(gameState.players).find((p) => p !== playerId);
  const enemy = enemyId ? gameState.players[enemyId] : null;

  if (!enemy) return <div className={styles.stateMessage}>Esperando enemigo...</div>;

  // We need to construct the visual state of the grid from MY perspective.
  // 1. Enemy Ships? NO (unless sunk, but for now let's hide them).
  // 2. My Hits on Enemy? Yes. (enemy.ships[].hits)
  // 3. My Misses on Enemy? Yes. (enemy.misses)

  const hits: Coordinates[] = [];
  if (enemy.ships) {
    for (const ship of enemy.ships) {
      if (ship.hits) {
        hits.push(...ship.hits);
      }
    }
  }

  const misses = enemy.misses || [];

  const isHit = (x: number, y: number) => hits.some((h) => h.x === x && h.y === y);
  const isMiss = (x: number, y: number) => misses.some((m) => m.x === x && m.y === y);

  const onCellClick = (x: number, y: number) => {
    if (gameState.turn !== playerId) return; // Not my turn

    // Skill Override
    if (onAttackOverride) {
      onAttackOverride(x, y);
      return;
    }

    if (isHit(x, y) || isMiss(x, y)) return; // Already attacked

    actions.attack(x, y);
  };

  const renderCells = () => {
    const cells: JSX.Element[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        let state: "EMPTY" | "HIT" | "MISS" = "EMPTY";
        if (isHit(x, y)) state = "HIT";
        if (isMiss(x, y)) state = "MISS";

        cells.push(
          <Cell
            key={`${x}-${y}`}
            x={x}
            y={y}
            state={state}
            onClick={(gx: number, gy: number) => onCellClick(gx, gy)}
            // Radar doesn't need hover ghost ships
          />
        );
      }
    }
    return cells;
  };

  return (
    <div className={styles.container}>
      <div className={styles.gridWrapper}>
        <div className={clsx(styles.grid, styles.radarGrid)}>{renderCells()}</div>
      </div>
    </div>
  );
};
