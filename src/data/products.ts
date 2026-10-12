export type NutritionItem = {
  label: string;
  amount: string;
};
export type Product = {
  id: number;
  name: string;
  category: string;
  packaging: "jar" | "pouch" | "sachet" | "bottle" | "bar";
  images: string[];
  description: string;
  longDescription: string;
  price: number;
  verified: boolean;
  goal: string[];
  size: string;
  ingredients: string[];
  verifiedReasons: string[];
  allergens?: string[];
  warnings?: string[];
  nutrition: {
    servingSize: string;
    servingsPerContainer: string;
    items: NutritionItem[];
  } | null;
  
  
};


export const products: Product[] = [
  {
    id: 1,
    name: "Creatina Monohidratada",
    category: "PERFORMANCE",
    packaging: "jar",
    images: [
      "/products/creatina/principal.webp",
      "/products/creatina/ingredientes.webp",
      "/products/creatina/nutrimental.webp",
    ],
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
    
    nutrition: {
      servingSize: "5 g",
      servingsPerContainer: "60",
      items: [
        {
          label: "Monohidrato de creatina",
          amount: "5 g",
        },
      ],
    },

  },
  {
    id: 2,
    name: "Grass-Fed Whey",
    category: "PROTEIN",
    packaging: "pouch",
    images: [
      "/products/whey/principal.webp",
      "/products/whey/ingredientes.webp",
      "/products/whey/nutrimental.webp",
    ],
    description:
      "Proteína de suero proveniente de ganado alimentado con pasto.",
    longDescription:
      "Una fuente práctica de proteína para complementar la alimentación cuando alcanzar los requerimientos únicamente con alimentos resulta menos conveniente.",
    price: 899,
    verified: true,
    goal: ["BUILD", "RECOVER"],
    size: "900 g · 30 porciones",
    ingredients: [
      "Aislado de proteína de suero de leche de vacas alimentadas con pasto",
    ],
    allergens: ["Contiene leche."],
    verifiedReasons: [
      "Fuente de proteína claramente identificada.",
      "Lista de ingredientes sencilla.",
      "Sin mezclas propietarias.",
      "Información transparente de formulación.",
    ],
    
    nutrition: {
      servingSize: "30 g",
      servingsPerContainer: "30",
      items: [
        {
          label: "Energía",
          amount: "120 kcal",
        },
        {
          label: "Proteínas",
          amount: "24 g",
        },
        {
          label: "Grasas totales",
          amount: "2 g",
        },
        {
          label: "Grasas saturadas",
          amount: "1 g",
        },
        {
          label: "Carbohidratos",
          amount: "1.5 g",
        },
        {
          label: "Azúcares totales",
          amount: "1 g",
        },
        {
          label: "Sodio",
          amount: "120 mg",
        },
      ],
    },

  },
  {
    id: 3,
    name: "Electrolitos",
    category: "HYDRATION",
    packaging: "sachet",
    images: [
      "/products/electrolitos/principal.webp",
      "/products/electrolitos/ingredientes.webp",
      "/products/electrolitos/nutrimental.webp",
    ],
    description:
      "Mezcla de electrolitos orientada a hidratación y entrenamiento.",
    longDescription:
      "Una mezcla orientada a sesiones prolongadas, condiciones de calor y situaciones donde las pérdidas de líquidos y electrolitos pueden ser mayores.",
    price: 389,
    verified: true,
    goal: ["ENDURE", "RECOVER"],
    size: "30 porciones",
    
    ingredients: [
      "Sal de mar",
      "Ácido cítrico",
      "Sal rosa del Himalaya",
      "Saborizante natural",
      "Glicinato de magnesio",
      "Cloruro de potasio",
      "Extracto de stevia",
      "Extracto de monk fruit",
    ],
    verifiedReasons: [
      "Minerales y cantidades claramente identificados.",
      "Sin mezclas propietarias.",
      "Formulación enfocada en hidratación.",
      "Uso contextual claramente explicado.",
    ],
    
    nutrition: {
      servingSize: "1 sobre (4.14 g)",
      servingsPerContainer: "30",
      items: [
        {
          label: "Energía",
          amount: "4 kcal (17 kJ)",
        },
        {
          label: "Grasas totales",
          amount: "0 g",
        },
        {
          label: "Grasas saturadas",
          amount: "0 g",
        },
        {
          label: "Grasas trans",
          amount: "0 g",
        },
        {
          label: "Carbohidratos",
          amount: "1 g",
        },
        {
          label: "Azúcares totales",
          amount: "0 g",
        },
        {
          label: "Azúcares añadidos",
          amount: "0 g",
        },
        {
          label: "Proteínas",
          amount: "0 g",
        },
        {
          label: "Sodio",
          amount: "1,000 mg",
        },
        {
          label: "Potasio",
          amount: "200 mg",
        },
        {
          label: "Magnesio",
          amount: "60 mg",
        },
      ],
    },

  },
  {
    id: 4,
    name: "Omega-3",
    category: "NUTRITION",
    packaging: "bottle",
    images: [
      "/products/omega3/principal.webp",
      "/products/omega3/ingredientes.webp",
      "/products/omega3/nutrimental.webp",
    ],
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
      "Gelatina de pescado (cápsula blanda)",
      "Glicerina",
      "Agua",
      "Mezcla de tocoferoles (antioxidante)",
    ],
    allergens: ["Contiene pescado."],

    verifiedReasons: [
      "Contenido de EPA y DHA declarado.",
      "Fuente claramente identificada.",
      "Composición transparente.",
      "Enfoque complementario a la alimentación.",
    ],
    
    nutrition: {
      servingSize: "2 cápsulas",
      servingsPerContainer: "30",
      items: [
        {
          label: "Aceite de pescado",
          amount: "2,000 mg",
        },
        {
          label: "EPA",
          amount: "360 mg",
        },
        {
          label: "DHA",
          amount: "240 mg",
        },
        {
          label: "EPA + DHA",
          amount: "600 mg",
        },
        {
          label: "Energía",
          amount: "18 kcal (75 kJ)",
        },
        {
          label: "Grasas totales",
          amount: "2 g",
        },
      ],
    },

  },
  {
  id: 5,
  name: "Real Food Protein Bar",
  category: "PERFORMANCE FOOD",
  packaging: "bar",
  images: [
      "/products/protein-bar/principal.webp",
      "/products/protein-bar/ingredientes.webp",
      "/products/protein-bar/nutrimental.webp",
    ],
  description:
    "Proteína y energía en una barra elaborada alrededor de ingredientes simples y reconocibles.",
  longDescription:
    "Una barra de proteína diseñada como alimento funcional para el día a día y alrededor del entrenamiento. Combina proteína de suero como fuente principal con miel, cacao y otros ingredientes seleccionados bajo la filosofía de formulación simple de Origen.",
  price: 69,
  verified: true,
  goal: ["BUILD", "RECOVER", "NOURISH"],
  size: "60 g · 1 barra",
  
    ingredients: [
      "Proteína de suero de leche grass-fed",
      "Colágeno bovino",
      "Néctar de coco",
      "Grasa bovina",
      "Cacao en polvo",
      "Miel",
      "Trozos de cacao",
      "Sal",
    ],
    allergens: ["Contiene leche."],
  
  nutrition: {
    servingSize: "1 barra (60 g)",
    servingsPerContainer: "1",
    items: [
      {
        label: "Energía",
        amount: "206 kcal (862 kJ)",
      },
      {
        label: "Proteínas",
        amount: "20 g",
      },
      {
        label: "Grasas totales",
        amount: "6 g",
      },
      {
        label: "Grasas saturadas",
        amount: "3.6 g",
      },
      {
        label: "Grasas trans",
        amount: "0 g",
      },
      {
        label: "Carbohidratos disponibles",
        amount: "18 g",
      },
      {
        label: "Azúcares totales",
        amount: "14 g",
      },
      {
        label: "Azúcares añadidos",
        amount: "14 g",
      },
      {
        label: "Fibra dietética",
        amount: "4 g",
      },
      {
        label: "Sodio",
        amount: "278 mg",
      },
    ],
  },

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
  packaging: "jar",
  images: [
      "/products/pre-performance/principal.webp",
      "/products/pre-performance/ingredientes.webp",
      "/products/pre-performance/nutrimental.webp",
    ],
  description:
    "Fórmula pre-entrenamiento inspirada en compuestos presentes naturalmente en alimentos.",
  longDescription:
    "Una propuesta de pre-entrenamiento centrada en rendimiento y transparencia. Combina una fuente estandarizada de nitratos procedente de betabel, granada rica en polifenoles, electrolitos y cafeína en una formulación deliberadamente sencilla.",
  price: 549,
  verified: true,
  goal: ["BUILD", "ENDURE"],
  size: "300 g · 30 porciones",
    
  ingredients: [
    "Extracto de betabel estandarizado en nitratos",
    "Extracto de granada rico en polifenoles",
    "Mezcla de electrolitos",
    "Cafeína",
  ],
  warnings: [
    "Contiene cafeína. Cantidad pendiente de definir.",
    "Formulación conceptual no disponible para comercialización.",
  ],

  verifiedReasons: [
    "Fuente de nitratos de origen vegetal",
    "Ingredientes seleccionados con un propósito definido",
    "Sin mezcla propietaria",
    "Contenido de cafeína declarado",
    "Formulación enfocada en rendimiento sin ingredientes innecesarios",
  ],
  
  nutrition: {
    servingSize: "10 g",
    servingsPerContainer: "30",
    items: [
      {
        label: "Energía",
        amount: "Por definir",
      },
      {
        label: "Proteínas",
        amount: "Por definir",
      },
      {
        label: "Grasas totales",
        amount: "Por definir",
      },
      {
        label: "Carbohidratos",
        amount: "Por definir",
      },
      {
        label: "Azúcares totales",
        amount: "Por definir",
      },
      {
        label: "Sodio",
        amount: "Por definir",
      },
      {
        label: "Potasio",
        amount: "Por definir",
      },
      {
        label: "Magnesio",
        amount: "Por definir",
      },
      {
        label: "Nitratos de betabel",
        amount: "Por definir",
      },
      {
        label: "Polifenoles de granada",
        amount: "Por definir",
      },
      {
        label: "Cafeína",
        amount: "Por definir",
      },
    ],
  },

},
];