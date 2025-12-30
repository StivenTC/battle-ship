# 📱 OCÉANO CIEGO: Sistema de Diseño & UX (Especificación Premium)

**Estilo General**: Minimalista, "Neon Radar", Glassmorphism, Mobile-First (Dribbble-Inspired).

---

## 1. El Encabezado Unificado (The Unified Header)
**Arquitectura**: Una sola fila minimalista. Eliminar etiquetas de texto innecesarias ("Estado: Jugando").
**Composición Flex**:
- **Izquierda**: `[Nickname Jugador]` + `[Indicador Conexión (Punto Neón)]`.
- **Centro**: `[Logo Simplificado / Sans-Serif Espaciado]`.
- **Derecha**: `[Código Sala]` + `[Icono Copiar]`.

**Estilo Visual**:
- **Fondo**: Glassmorphism puro (`rgba(255, 255, 255, 0.05)`).
- **Efecto**: `backdrop-filter: blur(12px)`.
- **Borde**: Inferior de 1px muy sutil (`rgba(255, 255, 255, 0.1)`).
- **Feedback**: El header completo parpadea en Rojo tenue brevemente al recibir daño / notificación crítica.

---

## 2. El Astillero (Selección de Barcos)
**Problema**: Grillas de tarjetas pequeñas son ilegibles en móvil.
**Solución**: **Carrusel Horizontal** (Scroll Snap).
- **Diseño de Tarjeta**: Ancho dominante (85vw) para enfoque total en móvil.
- **Visualización**:
  - **Centro**: Renderizado SVG real del barco (`ShipAsset`) en lugar de iconos genéricos.
  - **Indicadores**: Cuadros visuales (`sizePips`) para el tamaño.
  - **Info**: Habilidad en mayúsculas, Costo como "⚡ [N]".
  - **Estilo**: Borde Neón al seleccionar. **Sin checkmark** superpuesto (limpieza visual).

---

## 3. Habilidades Tácticas (Nombres & Efectos)
**Tema**: Militar / Tecnológico.

| Barco | Habilidad | Costo | Descripción |
| :--- | :--- | :--- | :--- |
| **Portaviones** | `DRON RECON` | 3 AP | Revela área 3x3 (Sin daño). |
| **Acorazado** | `IMPACTO CRUZADO` | 4 AP | Ataque en 'X' (Centro + 4 diagonales). |
| **Destructor** | `BOMBARDEO` | 3 AP | 3 disparos aleatorios globales. |
| **Submarino** | `TORPEDO` | 4 AP | Ataque en línea recta desde un borde. |
| **Corbeta** | `BALIZA` | 2 AP | 1x1. Revela todo el barco si impacta. |

---

## 4. Fase Táctica (Posicionamiento)
**Optimización de Espacio**:
- **Metadata**: Ocultar ID de partida y Capitán durante esta fase para ganar altura vertical.
- **Barcos**: Representados como contornos luminosos (Wireframe style).
- **Grilla**: Debe ocupar el ancho máximo disponible.

---

## 4. La Grilla de Combate (The Grid Morph)
**Dimensiones Visuales**: **6 celdas alto** x **8 celdas ancho** (Optimización vertical móvil).
- *Nota Técnica*: Si la lógica interna permanece en 10x10, esto puede requerir adaptación o scroll, pero la especificación visual prioritaria es 6x8.

**Identidad de Color**:
- **Grilla Propia (Defensa)**: Fondo Azul Profundo (`#0f172a`), Acentos/Bordes **Cian Neón** (`#22d3ee`).
- **Grilla Enemiga (Ataque)**: Fondo Casi Negro (`#020617`), Acentos/Bordes **Ámbar/Rojo Táctico** (`#f59e0b`).
- **Estilo de Celda**: Bordes ultra-finos (0.5px), opacidad baja. Efecto de "escaneo" en celdas enemigas.

**Transiciones (3D Parallax)**:
- **Cambio de Turno**: No usar deslizamiento lateral plano.
- **Animación**:
    1.  Grilla Saliente: Zoom-out ligero (scale 0.9) + Rotación Y (10deg) + Fade Out.
    2.  Grilla Entrante: Fade In + Zoom-in a escala normal (1).
- **Interacción**: Swipe manual con efecto "Rubber Banding" (resistencia elástica) en los bordes.

---

## 5. Interfaz de Habilidades (Combat Footer)
**Concepto**: "Slices" minimalistas. Eliminar todo texto posible.
**Layout**: Fila horizontal de iconos en la parte inferior.

**Componentes**:
- **Iconos**: Estrictamente **Monocromáticos y Vectoriales** (Ej: Dron simple, Cruz, Torpedo lineal).
- **Indicadores Costo**: Pequeño "Badge" numérico en la esquina superior derecha del icono (ej. un pequeño "3").
- **Estados**:
    - **Activo**: Opacidad 100%, Glow sutil del color del tema.
    - **Inactivo (AP Insuficiente)**: Escala de grises, Opacidad 30%.
- **Interacción**: Long-press (mantener pulsado) para ver el nombre de la habilidad.

**Barra de Energía (AP)**:
- Contador numérico simple (ej. `4/6`).
- Barra de progreso de 1px de grosor que brilla con el color de energía.

---

## 6. Feedback & Efectos (Juice)
- **Daño Recibido**: "Screen Shake" breve + Flash rojo tenue en fondo.
- **Victoria/Derrota**:
    - Fondo: Blur total de la interfaz de juego.
    - Texto: Tipografía con tracking amplio ("V I C T O R I A").
    - Efecto: Glow externo para profundidad.
- **Micro-interacciones**: Transiciones suaves (200ms) en hover/tap de celdas y botones.