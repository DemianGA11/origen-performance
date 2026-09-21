export type ProfileAnswers = {
  goal: string | null;
  trainingDays: string | null;
  trainingType: string | null;
  duration: string | null;
  sweatLevel: string | null;
  heatTraining: string | null;
  proteinMeals: string | null;
  fattyFish: string | null;
  outdoorTime: string | null;
  currentSupplements: string[];
  safetyFlags: string[];
};

export type RecommendationStatus =
  | "RELEVANT"
  | "POSSIBLY_USEFUL"
  | "LOW_RELEVANCE"
  | "DIETARY_FIRST"
  | "INSUFFICIENT_INFORMATION"
  | "ALREADY_USING"
  | "PROFESSIONAL_REVIEW";

export type Recommendation = {
  supplement: string;
  key: string;
  score: number | null;
  status: RecommendationStatus;
  reasons: string[];
};

export function generateRecommendations(
  answers: ProfileAnswers
): Recommendation[] {
  const requiresProfessionalReview =
    answers.safetyFlags.some((flag) => flag !== "none");

  if (requiresProfessionalReview) {
    return [
      {
        supplement: "Revisión profesional",
        key: "professional-review",
        score: null,
        status: "PROFESSIONAL_REVIEW",
        reasons: [
          "Una de tus respuestas indica que una recomendación automatizada puede no ser apropiada para tu contexto.",
          "Origen Profile no evaluará automáticamente suplementos en este caso.",
          "Considera revisar tu situación con un profesional de la salud antes de iniciar o modificar suplementación.",
        ],
      },
    ];
  }

  return [
    evaluateCreatine(answers),
    evaluateProtein(answers),
    evaluateElectrolytes(answers),
    evaluateOmega3(answers),
    evaluateVitaminD(answers),
  ];
}
function evaluateCreatine(
  answers: ProfileAnswers
): Recommendation {
  if (answers.currentSupplements.includes("creatine")) {
    return {
      supplement: "Creatina monohidratada",
      key: "creatine",
      score: null,
      status: "ALREADY_USING",
      reasons: ["Indicaste que actualmente consumes creatina."],
    };
  }

  let score = 0;
  const reasons: string[] = [];

  if (answers.goal === "strength") {
    score += 3;
    reasons.push("Tu objetivo principal es aumentar fuerza.");
  }

  if (answers.goal === "muscle") {
    score += 3;
    reasons.push("Tu objetivo principal es ganar masa muscular.");
  }

  if (
    answers.trainingType === "strength" ||
    answers.trainingType === "hypertrophy"
  ) {
    score += 3;
    reasons.push("Realizas entrenamiento de fuerza o hipertrofia.");
  }

  if (
    answers.trainingType === "hiit" ||
    answers.trainingType === "sports"
  ) {
    score += 2;
    reasons.push(
      "Realizas actividad con esfuerzos repetidos de alta intensidad."
    );
  }

  if (
    answers.trainingDays === "3-4" ||
    answers.trainingDays === "5-6" ||
    answers.trainingDays === "7"
  ) {
    score += 2;
    reasons.push("Entrenas al menos tres días por semana.");
  }

  let status: RecommendationStatus = "LOW_RELEVANCE";

  if (score >= 6) {
    status = "RELEVANT";
  } else if (score >= 3) {
    status = "POSSIBLY_USEFUL";
  }

  return {
    supplement: "Creatina monohidratada",
    key: "creatine",
    score,
    status,
    reasons,
  };
}
function evaluateProtein(
  answers: ProfileAnswers
): Recommendation {
  if (answers.currentSupplements.includes("protein")) {
    return {
      supplement: "Proteína",
      key: "protein",
      score: null,
      status: "ALREADY_USING",
      reasons: ["Indicaste que actualmente utilizas proteína en polvo."],
    };
  }

  let score = 0;
  const reasons: string[] = [];

  if (answers.goal === "muscle") {
    score += 2;
    reasons.push("Tu objetivo incluye ganar masa muscular.");
  }

  if (answers.goal === "strength") {
    score += 1;
    reasons.push("Tu objetivo incluye mejorar fuerza.");
  }

  if (
    answers.trainingDays === "3-4" ||
    answers.trainingDays === "5-6" ||
    answers.trainingDays === "7"
  ) {
    score += 1;
  }

  if (answers.proteinMeals === "0-1") {
    score += 4;
    reasons.push(
      "Reportas pocas comidas con una fuente importante de proteína."
    );
  }

  if (answers.proteinMeals === "2") {
    score += 2;
    reasons.push(
      "Una fuente conveniente de proteína podría complementar tu alimentación."
    );
  }

  let status: RecommendationStatus = "LOW_RELEVANCE";

  if (score >= 6) {
    status = "RELEVANT";
  } else if (score >= 3) {
    status = "POSSIBLY_USEFUL";
  }

  return {
    supplement: "Proteína",
    key: "protein",
    score,
    status,
    reasons,
  };
}
function evaluateElectrolytes(
  answers: ProfileAnswers
): Recommendation {
  if (answers.currentSupplements.includes("electrolytes")) {
    return {
      supplement: "Electrolitos",
      key: "electrolytes",
      score: null,
      status: "ALREADY_USING",
      reasons: ["Indicaste que actualmente consumes electrolitos."],
    };
  }

  let score = 0;
  const reasons: string[] = [];

  if (answers.duration === "over120") {
    score += 4;
    reasons.push("Tus sesiones suelen superar las dos horas.");
  } else if (answers.duration === "75-120") {
    score += 3;
    reasons.push("Tus sesiones suelen durar entre 75 y 120 minutos.");
  } else if (answers.duration === "45-75") {
    score += 1;
  }

  if (answers.sweatLevel === "high") {
    score += 3;
    reasons.push("Reportas una sudoración elevada durante el entrenamiento.");
  } else if (answers.sweatLevel === "moderate") {
    score += 1;
  }

  if (answers.heatTraining === "often") {
    score += 2;
    reasons.push("Entrenas frecuentemente en condiciones de calor.");
  } else if (answers.heatTraining === "sometimes") {
    score += 1;
  }

  if (
    answers.trainingType === "running" ||
    answers.trainingType === "cycling"
  ) {
    score += 2;
    reasons.push("Realizas principalmente entrenamiento de resistencia.");
  }

  let status: RecommendationStatus = "LOW_RELEVANCE";

  if (score >= 6) {
    status = "RELEVANT";
  } else if (score >= 3) {
    status = "POSSIBLY_USEFUL";
  }

  return {
    supplement: "Electrolitos",
    key: "electrolytes",
    score,
    status,
    reasons,
  };
}
function evaluateOmega3(
  answers: ProfileAnswers
): Recommendation {
  if (answers.currentSupplements.includes("omega3")) {
    return {
      supplement: "Omega-3",
      key: "omega3",
      score: null,
      status: "ALREADY_USING",
      reasons: ["Indicaste que actualmente consumes omega-3."],
    };
  }

  if (answers.fattyFish === "0" || answers.fattyFish === "1") {
    return {
      supplement: "Omega-3",
      key: "omega3",
      score: null,
      status: "DIETARY_FIRST",
      reasons: [
        "Reportas un consumo bajo de pescado graso.",
        "Primero puede considerarse aumentar las fuentes alimentarias de EPA y DHA.",
      ],
    };
  }

  return {
    supplement: "Omega-3",
    key: "omega3",
    score: null,
    status: "LOW_RELEVANCE",
    reasons: [
      "Reportas consumir pescado graso con relativa frecuencia.",
    ],
  };
}

function evaluateVitaminD(
  answers: ProfileAnswers
): Recommendation {
  if (answers.currentSupplements.includes("vitaminD")) {
    return {
      supplement: "Vitamina D",
      key: "vitaminD",
      score: null,
      status: "ALREADY_USING",
      reasons: ["Indicaste que actualmente consumes vitamina D."],
    };
  }

  return {
    supplement: "Vitamina D",
    key: "vitaminD",
    score: null,
    status: "INSUFFICIENT_INFORMATION",
    reasons: [
      answers.outdoorTime === "low"
        ? "Reportas poca exposición habitual al exterior, pero este dato no permite determinar tu estado de vitamina D."
        : "Los hábitos reportados no permiten determinar tu estado de vitamina D.",
      "Se requiere información adicional para valorar una posible suplementación.",
    ],
  };
}