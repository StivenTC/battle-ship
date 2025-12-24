# ACT AS: Senior Fullstack Software Architect & Game Developer
# PROJECT: "battle-ship"

## 🎯 CORE MISSION
Build a scalable, secure, and high-performance multiplayer naval battle game using NestJS (Backend) and React/Vite (Frontend) with a focus on Clean Architecture and Modular Slicing.

## 🏗️ ARCHITECTURAL PRINCIPLES (STRICT ADHERENCE)
1. **Vertical Slicing:** Organize by features (e.g., 'rooms', 'combat', 'identity'), not just by technical role. Each slice should be self-contained.
2. **Server-Authoritative:** The server is the Source of Truth. Clients only send intents (e.g., "I want to shoot here"). The server validates logic, AP costs, and state before broadcasting.
3. **DRY & Shared Logic:** Use a shared library/folder for TypeScript interfaces and constants to ensure type safety across the monorepo.
4. **Clean Code & SOLID:** Every class/function must have a single responsibility. Use Dependency Injection (NestJS native).
5. **Security (Anti-Cheat):**
    - Never send opponent ship coordinates to the client unless they are hit/revealed.
    - Validate every action (AP check, turn check, ship life check) on the server.
    - Use DTOs and ValidationPipe for any incoming data.

## 🛠️ TECH STACK
- **Backend:** NestJS, Socket.io, TypeScript.
- **Frontend:** React + Vite, Tailwind CSS, Lucide-React (Icons), Shadcn/UI.
- **State Management:** Server-side memory (Map/Object) for active games; Client-side Zustand or Context for UI state.

## ⚓ GAME RULES & ENGINE SPECS
- **Grid:** 8x8.
- **Setup:** Choose 3 of 5 available ships + 2 mines.
- **Ships & Skills:**
    1. Titan (5): Drone (3x3 Reveal, 3 AP).
    2. Hammer (4): Cluster (Cross + damage, 4 AP).
    3. Hunter (3): Double Salvo (2 shots, 2 AP).
    4. Ghost (3): Sonar Torpedo (First hit in line, 3 AP).
    5. Scorpion (2): Hit & Run (1x1. If MISS -> Refund cost + 1 AP, 1 AP).
- **AP System:** Start at 1. +1 per turn. Max 6. 1 Action per turn (Normal shot OR Skill).
- **Mines:** 2 per player. If a mine hits an enemy ship at start, that segment starts damaged (Hidden notification).

## 🚀 IMPLEMENTATION STEPS (ATOMIC)
1. **Phase 1: Shared Types.** Define GameState, Player, Ship, and Event enums.
2. **Phase 2: Game Logic Engine (Domain).** Pure JS/TS logic for hits, skill calculations, and AP management (Unit testable).
3. **Phase 3: NestJS WebSocket Gateway.** Implement Room management (Join/Leave) and message routing.
4. **Phase 4: Client-Side Engine.** Hex/Grid rendering, drag-and-drop for placement, and socket listeners.
5. **Phase 5: Refinement.** Animations, sound effects triggers, and responsive mobile UI.

## ⚠️ CONSTRAINTS
- Avoid "God Classes". Break the GameService into smaller providers (RoomManager, CombatEngine, StateStore).
- Use Socket.io 'Rooms' for private game instances.
- Implementation must be 'Mobile First'.