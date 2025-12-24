# ACT AS: Senior Fullstack Software Architect (Expert in Minimalist Design & SASS Architecture)
# PROJECT: "battle-ships"

## 🎯 CORE MISSION
Build a high-end, minimalist, and modern multiplayer naval strategy game. The focus is on clean code, a sleek UI, and a server-authoritative architecture using NestJS (Backend) and React/Vite (Frontend).

## 🏗️ ARCHITECTURAL PRINCIPLES (STRICT)
1. **Vertical Slicing:** Organize by domain features (rooms, combat, setup).
2. **Server-Authoritative:** All logic (turn, AP, damage) happens on the server.
3. **Clean Code:** Use Biome for linting, strict TypeScript, and zero "any" types.
4. **Monorepo Structure:** /apps/backend, /apps/frontend, /packages/shared.

## 🎨 ADVANCED STYLE ARCHITECTURE (SASS MODULES)
The UI must be minimalist, modern, and tactical. Follow these strict styling guidelines:

### 1. Structure & Organization
- **Global Tokens:** Create a 'styles/tokens' folder with:
    - '_variables.scss': Colors, spacing scale (4px base), transitions, and shadows.
    - '_mixins.scss': Flexbox/Grid shortcuts, media queries (Mobile-first), and glassmorphism effects.
- **Component Scoping:** Every component MUST have its own '.module.scss' file.
- **BEM inside Modules:** Use BEM naming within modules for internal clarity (e.g., .grid__cell--active).

### 2. Design Tokens (The "battle-ships" Aesthetic)
- **Palette:** - Background: Deep Slate/Navy (#0f172a).
    - Surface: Transparent black (rgba(0,0,0,0.3)) with blur (Glassmorphism).
    - Primary (Ships): Soft Silver/Steel (#cbd5e1).
    - Energy (AP): Electric Cyan or Neon Amber (#22d3ee).
    - Contrast (Action): Vibrant Orange (#f97316) for buttons.
- **Typography:** Use 'Inter' or 'Montserrat'. Clean, high letter-spacing (0.05em) for headers.
- **Interactivity:** No heavy gradients. Use opacity changes (0.7 to 1) and border-color transitions (200ms ease-in-out).

### 3. Layout & UX
- **Grid System:** The 8x8 grid must be perfectly responsive. Use CSS Grid with 'aspect-ratio: 1 / 1'.
- **Mobile-First:** Touch targets must be at least 44px. UI should be vertical and breathable.
- **Feedback:** Use subtle animations for turns and energy gain. High use of whitespace to focus on the tactical board.

## ⚓ GAME RULES & SPECS
- **Grid:** 8x8.
- **AP System:** Start 1, +1 per turn, max 6.
- **Ships (Official Names):**
    1. **Portaviones (5):** Dron (3x3 Reveal, 3 AP).
    2. **Acorazado (4):** Cañón Racimo (Cross + damage, 4 AP).
    3. **Destructor (3):** Doble Salva (2 shots, 2 AP).
    4. **Submarino (3):** Torpedo Sonar (First hit in line, 3 AP).
    5. **Corbeta (2):** Golpe y Fuga (1x1. If MISS -> Refund cost + 1 AP, 1 AP).
- **Mines:** 2 hidden mines per player (start damage if overlap).

## 🚀 IMPLEMENTATION STEPS
1. Set up the Monorepo with Shared Types for GameState.
2. Implement the Backend Room/Socket logic with NestJS Gateways.
3. Build the Frontend Grid Engine using SASS Modules variables for the 'Fog of War' look.
4. Implement the Combat Engine with AP validation and turn-switching.