# 📱 "Océano Ciego" - Design System & Technical Specs
**Theme:** Tactical Radar (Dark Mode / High Contrast)
**Approach:** Mobile-First, Fixed-Unit Grid, SVG-based.

---

## 1. The Grid System (Strict 32px Base)
We are moving from a fluid grid to a **fixed-unit grid** to ensure asset crispness and consistent spacing across devices.

### Dimensions
* **Grid Layout:** 10 columns x 10 rows.
* **Base Cell Size:** \`32px\` (Fixed).
* **Total Board Width:** \`320px\`.
* **Alignment:**
    * The grid container must be **centered horizontally** (\`margin: 0 auto\`).
    * On devices narrower than 340px, revert to \`100%\` width, but for standard mobile (360px+), keep it fixed at 320px.

### Spacing & Layout
* **Padding/Margins:**
    * On a standard 360px Android: Leaves \`20px\` whitespace per side (Comfortable).
    * On a standard 390px iPhone: Leaves \`35px\` whitespace per side (Spacious).
* **Gap:** \`1px\` (Visual separator).

---

## 2. Color Palette (Variables)
Use CSS Custom Properties (Variables) for consistency.

\`\`\`css
:root {
  /* -- Backgrounds -- */
  --color-bg-deep: #0a192f;      /* Main app background */
  --color-bg-grid: #112240;      /* Grid cell background */

  /* -- Radar / Allies -- */
  --color-radar-primary: #64ffda; /* Neon Cyan (Ships, UI borders) */
  --color-radar-dim: rgba(100, 255, 218, 0.1); /* Ship fill */

  /* -- Combat States -- */
  --color-hit: #ff5555;          /* Red (Hit / Enemy) */
  --color-miss: #8892b0;         /* Grey/Blue (Miss / Water splash) */
  --color-sunk: #ff0000;         /* Bright Red (Ship Sunk) */

  /* -- Typography -- */
  --color-text-main: #ccd6f6;    /* Off-white */
  --color-text-muted: #8892b0;   /* Secondary text */
}
\`\`\`

---

## 3. Typography
Use a Monospaced or Technical font.
* **Font Family:** 'Roboto Mono', 'Fira Code', monospace.
* **Base Size:** 14px.
* **Headers:** Uppercase, tracking (letter-spacing) \`1.5px\`.

---

## 4. Ship Assets (Fixed SVG Dimensions)
Since cells are strictly 32px, we can define precise pixel dimensions for the SVG assets, ensuring pixel-perfect rendering.

**Scaling Rule:**
* **1 Cell = 32px.**
* **Stroke:** \`2px\` (Constant).

| Ship Class (Code) | Size (Cells) | Pixel Dimensions (approx) | Placeholder Shape |
| :--- | :--- | :--- | :--- |
| \`Carrier\` | **5** | **160px x 32px** | Long rectangle + Runway line. |
| \`Battleship\` | **4** | **128px x 32px** | Robust rectangle + 3 Turrets. |
| \`Destroyer\` | **3** | **96px x 32px** | Medium rectangle + 2 Turrets. |
| \`Submarine\` | **3** | **96px x 32px** | Pill shape (Rounded caps). |
| \`Corvette\` | **2** | **64px x 32px** | Short rectangle + 1 Turret. |

*Note: The "Pixel Dimensions" include the grid gap in the visual calculation, but for the SVG viewBox, assume standard multiples of 32.*

---

## 5. UI Components & Interaction

### Touch Targets
* Since **32px** is below the recommended 44px touch target size, interactions (tapping a cell) must be handled carefully.
* **Implementation Note:** Ensure the click listener is attached to the *Cell* container, not just the center point, to maximize the hit area.

### Visual States
* **Selection:** When a user selects a ship to place, highlight valid grid slots in \`--color-radar-dim\`.
* **Error:** If placement is invalid (overlap), pulse the ship in \`--color-hit\`.