export type Product = {
  id: number;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  price: number;
  verified: boolean;
  goal: string[];
  size: string;
  ingredients: string[];
  verifiedReasons: string[];
};

export const products: Product[] = [
  {
    id: 1,
    name: "Creatina Monohidratada",
    category: "PERFORMANCE",
    description:
      "Creatina monohidratada de fórmula simple, sin mezclas propietarias.",
    longDescription:
      "Una fórmula simple diseñada para quienes buscan complementar entrenamiento de fuerza, potencia y rendimiento de alta intensidad.",
    price: 449,
    verified: true,
    goal: ["BUILD"],
    size: "300 g · 60 porciones",
    ingredients: ["Creatina monohidratada"],
    verifiedReasons: [
      "Fórmula de un solo ingrediente.",
      "Sin mezclas propietarias.",
      "Composición y cantidad claramente declaradas.",
      "Propósito de uso claramente definido.",
    ],
  },
  {
    id: 2,
    name: "Grass-Fed Whey",
    category: "PROTEIN",
    description:
      "Proteína de suero proveniente de ganado alimentado con pasto.",
    longDescription:
      "Una fuente práctica de proteína para complementar la alimentación cuando alcanzar los requerimientos únicamente con alimentos resulta menos conveniente.",
    price: 899,
    verified: true,
    goal: ["BUILD", "RECOVER"],
    size: "900 g · 30 porciones",
    ingredients: [
      "Proteína de suero de leche",
      "Sabor natural",
      "Lecitina",
    ],
    verifiedReasons: [
      "Fuente de proteína claramente identificada.",
      "Lista de ingredientes sencilla.",
      "Sin mezclas propietarias.",
      "Información transparente de formulación.",
    ],
  },
  {
    id: 3,
    name: "Electrolitos",
    category: "HYDRATION",
    description:
      "Mezcla de electrolitos orientada a hidratación y entrenamiento.",
    longDescription:
      "Una mezcla orientada a sesiones prolongadas, condiciones de calor y situaciones donde las pérdidas de líquidos y electrolitos pueden ser mayores.",
    price: 389,
    verified: true,
    goal: ["ENDURE", "RECOVER"],
    size: "30 porciones",
    ingredients: [
      "Sodio",
      "Potasio",
      "Magnesio",
      "Sabor natural",
    ],
    verifiedReasons: [
      "Minerales y cantidades claramente identificados.",
      "Sin mezclas propietarias.",
      "Formulación enfocada en hidratación.",
      "Uso contextual claramente explicado.",
    ],
  },
  {
    id: 4,
    name: "Omega-3",
    category: "NUTRITION",
    description:
      "Fuente concentrada de EPA y DHA con información clara de composición.",
    longDescription:
      "Una fuente de EPA y DHA para complementar la alimentación cuando el consumo habitual de pescado graso es limitado.",
    price: 499,
    verified: true,
    goal: ["NOURISH"],
    size: "60 cápsulas",
    ingredients: [
      "Aceite de pescado",
      "EPA",
      "DHA",
      "Cápsula de gelatina",
    ],
    verifiedReasons: [
      "Contenido de EPA y DHA declarado.",
      "Fuente claramente identificada.",
      "Composición transparente.",
      "Enfoque complementario a la alimentación.",
    ],
  },
  {
  id: 5,
  name: "Real Food Protein Bar",
  category: "PERFORMANCE FOOD",
  description:
    "Proteína y energía en una barra elaborada alrededor de ingredientes simples y reconocibles.",
  longDescription:
    "Una barra de proteína diseñada como alimento funcional para el día a día y alrededor del entrenamiento. Combina proteína de suero como fuente principal con miel, cacao y otros ingredientes seleccionados bajo la filosofía de formulación simple de Origen.",
  price: 69,
  verified: true,
  goal: ["BUILD", "RECOVER", "NOURISH"],
  size: "60 g · 1 barra",
  ingredients: [
    "Proteína de suero de leche",
    "Miel",
    "Cacao",
    "Manteca de cacao",
    "Colágeno hidrolizado",
    "Sal de mar",
  ],
  verifiedReasons: [
    "Proteína de suero como fuente principal de proteína",
    "Lista corta de ingredientes reconocibles",
    "Sin mezcla propietaria",
    "Sin colorantes artificiales",
    "Diseñada como una alternativa práctica de alimento rico en proteína",
  ],
},
{
  id: 6,
  name: "Pre-Performance",
  category: "PERFORMANCE",
  description:
    "Fórmula pre-entrenamiento inspirada en compuestos presentes naturalmente en alimentos.",
  longDescription:
    "Una propuesta de pre-entrenamiento centrada en rendimiento y transparencia. Combina una fuente estandarizada de nitratos procedente de betabel, granada rica en polifenoles, electrolitos y cafeína en una formulación deliberadamente sencilla.",
  price: 549,
  verified: true,
  goal: ["BUILD", "ENDURE"],
  size: "300 g · 30 porciones",
  ingredients: [
    "Concentrado de betabel estandarizado en nitratos",
    "Extracto de granada",
    "Sodio",
    "Potasio",
    "Cafeína",
    "Sabor natural",
  ],
  verifiedReasons: [
    "Fuente de nitratos de origen vegetal",
    "Ingredientes seleccionados con un propósito definido",
    "Sin mezcla propietaria",
    "Contenido de cafeína declarado",
    "Formulación enfocada en rendimiento sin ingredientes innecesarios",
  ],
},
];