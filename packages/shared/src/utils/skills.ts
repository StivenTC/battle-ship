import type { Coordinates } from "../types/game";
import { GRID_SIZE } from "../constants";

type PatternType = "SCAN_3X3" | "CROSS_DIAGONAL" | "GLOBAL_RANDOM_3" | "LINE_RAY" | "SINGLE_REVEAL";

export function getSkillAffectedCells(pattern: PatternType, cx: number, cy: number): Coordinates[] {
  const cells: Coordinates[] = [];

  if (pattern === "SCAN_3X3") {
    // 3x3 Area
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
          cells.push({ x, y });
        }
      }
    }
  } else if (pattern === "CROSS_DIAGONAL") {
    // X Pattern: Center + 4 Diagonals
    const offsets = [
      { dx: 0, dy: 0 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: 1, dy: 1 },
    ];
    for (const o of offsets) {
      const x = cx + o.dx;
      const y = cy + o.dy;
      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        cells.push({ x, y });
      }
    }
  } else if (pattern === "SINGLE_REVEAL") {
    cells.push({ x: cx, y: cy });
  } else if (pattern === "GLOBAL_RANDOM_3") {
    // No preview for global random
  } else if (pattern === "LINE_RAY") {
    // Sonar Torpedo: Vertical only (Bottom-Up visual)
    // We affect the whole column for preview purposes.
    // The hit logic determines where it stops.
    for (let i = 0; i < GRID_SIZE; i++) {
      cells.push({ x: cx, y: i });
    }
  }

  return cells;
}
