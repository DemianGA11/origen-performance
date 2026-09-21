export type Product = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  verified: boolean;
  goal: string[];
};

export const products: Product[] = [
  {
    id: 1,
    name: "Creatina Monohidratada",
    category: "PERFORMANCE",
    description:
      "Creatina monohidratada de fórmula simple, sin mezclas propietarias.",
    price: 449,
    verified: true,
    goal: ["BUILD"],
  },
  {
    id: 2,
    name: "Grass-Fed Whey",
    category: "PROTEIN",
    description:
      "Proteína de suero proveniente de ganado alimentado con pasto.",
    price: 899,
    verified: true,
    goal: ["BUILD", "RECOVER"],
  },
  {
    id: 3,
    name: "Electrolitos",
    category: "HYDRATION",
    description:
      "Mezcla de electrolitos orientada a hidratación y entrenamiento.",
    price: 389,
    verified: true,
    goal: ["ENDURE", "RECOVER"],
  },
  {
    id: 4,
    name: "Omega-3",
    category: "NUTRITION",
    description:
      "Fuente concentrada de EPA y DHA con información clara de composición.",
    price: 499,
    verified: true,
    goal: ["NOURISH"],
  },
];