// perfiles de categoría por eje (-50 = polo izquierdo, +50 = polo derecho)
// ajusta estos valores según encaje con tu criterio de diseño

const QUIZ_AXES = [
  {
    id: "digital-fisico",
    left: "Digital",
    right: "Físico",
  },
  {
    id: "color-sobriedad",
    left: "Color",
    right: "Sobriedad",
  },
  {
    id: "conceptual-tecnico",
    left: "Conceptual",
    right: "Técnico",
  },
  {
    id: "tecnologia-artesania",
    left: "Tecnología",
    right: "Artesanía",
  },
  {
    id: "movimiento-estatico",
    left: "Movimiento",
    right: "Estático",
  },
  {
    id: "personas-comunicar",
    left: "Diseño para personas",
    right: "Para comunicar",
  },
];

const CATEGORY_PROFILES = {
  "diseno-grafico": {
    "digital-fisico": 0.2,
    "color-sobriedad": 0.55,
    "conceptual-tecnico": 0.35,
    "tecnologia-artesania": 0.25,
    "movimiento-estatico": -0.15,
    "personas-comunicar": 0.65,
  },
  "diseno-digital-interactivo": {
    "digital-fisico": 0.85,
    "color-sobriedad": 0.15,
    "conceptual-tecnico": 0.55,
    "tecnologia-artesania": 0.75,
    "movimiento-estatico": 0.25,
    "personas-comunicar": 0.45,
  },
  "motion-video": {
    "digital-fisico": 0.7,
    "color-sobriedad": 0.45,
    "conceptual-tecnico": 0.2,
    "tecnologia-artesania": 0.4,
    "movimiento-estatico": 0.9,
    "personas-comunicar": 0.75,
  },
  "3d-cgi": {
    "digital-fisico": 0.8,
    "color-sobriedad": 0.3,
    "conceptual-tecnico": 0.7,
    "tecnologia-artesania": 0.85,
    "movimiento-estatico": 0.5,
    "personas-comunicar": 0.35,
  },
  "diseno-industrial-producto": {
    "digital-fisico": -0.55,
    "color-sobriedad": -0.1,
    "conceptual-tecnico": 0.6,
    "tecnologia-artesania": 0.35,
    "movimiento-estatico": -0.25,
    "personas-comunicar": 0.55,
  },
  "diseno-experiencias-servicios": {
    "digital-fisico": 0.35,
    "color-sobriedad": -0.15,
    "conceptual-tecnico": -0.45,
    "tecnologia-artesania": 0.1,
    "movimiento-estatico": -0.1,
    "personas-comunicar": -0.75,
  },
  "research-strategy": {
    "digital-fisico": 0.4,
    "color-sobriedad": -0.35,
    "conceptual-tecnico": -0.7,
    "tecnologia-artesania": -0.1,
    "movimiento-estatico": -0.35,
    "personas-comunicar": 0.15,
  },
  "diseno-moda-textil": {
    "digital-fisico": -0.35,
    "color-sobriedad": 0.75,
    "conceptual-tecnico": 0.15,
    "tecnologia-artesania": 0.65,
    "movimiento-estatico": 0.35,
    "personas-comunicar": 0.5,
  },
  "diseno-espacial-ambiental": {
    "digital-fisico": -0.7,
    "color-sobriedad": 0.1,
    "conceptual-tecnico": 0.25,
    "tecnologia-artesania": 0.55,
    "movimiento-estatico": -0.55,
    "personas-comunicar": 0.4,
  },
  "creative-coding-new-media": {
    "digital-fisico": 0.9,
    "color-sobriedad": 0.4,
    "conceptual-tecnico": 0.65,
    "tecnologia-artesania": 0.9,
    "movimiento-estatico": 0.55,
    "personas-comunicar": 0.25,
  },
  "fotografia-creacion-imagen": {
    "digital-fisico": 0.45,
    "color-sobriedad": 0.5,
    "conceptual-tecnico": -0.35,
    "tecnologia-artesania": 0.3,
    "movimiento-estatico": 0.05,
    "personas-comunicar": 0.6,
  },
  "publicidad-direccion-creativa": {
    "digital-fisico": 0.55,
    "color-sobriedad": 0.6,
    "conceptual-tecnico": 0.1,
    "tecnologia-artesania": 0.05,
    "movimiento-estatico": 0.45,
    "personas-comunicar": 0.85,
  },
  "diseno-videojuegos": {
    "digital-fisico": 0.95,
    "color-sobriedad": 0.35,
    "conceptual-tecnico": 0.6,
    "tecnologia-artesania": 0.8,
    "movimiento-estatico": 0.75,
    "personas-comunicar": 0.4,
  },
  "diseno-sonido": {
    "digital-fisico": 0.5,
    "color-sobriedad": -0.2,
    "conceptual-tecnico": 0.15,
    "tecnologia-artesania": 0.45,
    "movimiento-estatico": 0.6,
    "personas-comunicar": 0.55,
  },
};

/* Cuántas categorías pasan a la sección de imágenes */
const TOP_CATEGORIES_FOR_MATCH = 5;

/* Imágenes por página en DAME UN MATCH */
const MATCH_PAGE_SIZE = 10;
