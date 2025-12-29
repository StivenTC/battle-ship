export const TEXTS = {
  GAME_TITLE: "BATTLESHIP",
  LOBBY: {
    TITLE: "Centro de Mando",
    CREATE_BTN: "Crear Nueva Partida",
    CREATING: "Creando...",
    JOIN_BTN: "Unirse",
    DIVIDER: "o",
    INPUT_PLACEHOLDER: "ID de Partida (4 Letras)",
    ERRORS: {
      GENERIC: "Error al unirse",
    },
  },
  WAITING_ROOM: {
    TITLE: "ESTACIÓN DE COMBATE",
    CODE_LABEL: "CÓDIGO DE ACCESO",
    STATUS: "ESPERANDO JUGADOR RIVAL...",
  },
  HEADER: {
    COPY_BTN_TITLE: "Copiar código de sala",
    COPY_FEEDBACK: "¡Copiado!",
    CONNECTED_TITLE: "Conectado",
    DEFAULT_PLAYER_NAME: "Capitán",
  },
  PLACEMENT: {
    TITLE: "FASE TÁCTICA",
    INSTRUCTION_MAIN: "Posiciona tus 3 barcos y 2 minas.",
    INSTRUCTION_SUB: "Arrastra o pulsa para colocar. Rotar con click derecho o botón.",
  },
  COMBAT: {
    TURN_MY: "TU TURNO - ATACAR",
    TURN_ENEMY: "TURNO ENEMIGO - DEFENDER",
    ACTION_MY: "Selecciona una celda enemiga",
    ACTION_ENEMY: "Esperando impacto...",
    FEEDBACK: {
      ATTACK_RESULTS: "Resultados del Ataque...",
      DEFENSE_TURN: "Turno de Defensa",
      ENEMY_TURN_END: "¡TURNO ENEMIGO FINALIZADO!",
      MY_TURN_START: "¡TU TURNO!",
      SKILL_ACTIVATED: (skillName: string) => `${skillName} ACTIVADO!`,
      SKILL_LAUNCHED: (skillName: string) => `${skillName} LANZADA!`,
    },
    VICTORY_TITLE: "VICTORIA",
    DEFEAT_TITLE: "DERROTA",
    WINNER_LABEL: "Ganador:",
    ENEMY_FLEET: "Flota Enemiga",
  },
};
