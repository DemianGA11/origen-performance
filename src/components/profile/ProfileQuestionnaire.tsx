"use client";
import {
  generateRecommendations,
  Recommendation,
} from "@/lib/recommendationEngine";
import { useState } from "react";

type Answers = {
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

const goals = [
  { id: "muscle", label: "Ganar masa muscular" },
  { id: "strength", label: "Aumentar fuerza" },
  { id: "performance", label: "Rendimiento deportivo" },
  { id: "endurance", label: "Running / endurance" },
  { id: "recovery", label: "Recuperación" },
  { id: "wellness", label: "Salud y bienestar" },
];

const trainingDays = [
  { id: "0", label: "No entreno actualmente" },
  { id: "1-2", label: "1–2 días" },
  { id: "3-4", label: "3–4 días" },
  { id: "5-6", label: "5–6 días" },
  { id: "7", label: "Todos los días" },
];

const trainingTypes = [
  { id: "strength", label: "Fuerza" },
  { id: "hypertrophy", label: "Hipertrofia" },
  { id: "running", label: "Running" },
  { id: "cycling", label: "Ciclismo" },
  { id: "hiit", label: "HIIT / CrossFit" },
  { id: "sports", label: "Deportes" },
  { id: "mixed", label: "Entrenamiento mixto" },
];

const durations = [
  { id: "under45", label: "Menos de 45 min" },
  { id: "45-75", label: "45–75 min" },
  { id: "75-120", label: "75–120 min" },
  { id: "over120", label: "Más de 2 horas" },
];

const sweatLevels = [
  { id: "low", label: "Poco" },
  { id: "moderate", label: "Moderadamente" },
  { id: "high", label: "Mucho" },
];
const heatTraining = [
  { id: "often", label: "Frecuentemente" },
  { id: "sometimes", label: "A veces" },
  { id: "never", label: "Casi nunca" },
];

const proteinMeals = [
  { id: "0-1", label: "0–1 comidas" },
  { id: "2", label: "2 comidas" },
  { id: "3", label: "3 comidas" },
  { id: "4+", label: "4 o más comidas" },
];

const fattyFish = [
  { id: "0", label: "Nunca" },
  { id: "1", label: "1 vez por semana" },
  { id: "2", label: "2 veces por semana" },
  { id: "3+", label: "3 o más veces por semana" },
];

const outdoorTime = [
  { id: "low", label: "Muy poco" },
  { id: "moderate", label: "Algo" },
  { id: "high", label: "Frecuentemente" },
];

const currentSupplements = [
  { id: "none", label: "Ninguno" },
  { id: "creatine", label: "Creatina" },
  { id: "protein", label: "Proteína" },
  { id: "electrolytes", label: "Electrolitos" },
  { id: "omega3", label: "Omega-3" },
  { id: "vitaminD", label: "Vitamina D" },
];
const safetyOptions = [
  {
    id: "none",
    label: "Ninguna de las anteriores",
  },
  {
    id: "minor",
    label: "Soy menor de 18 años",
  },
  {
    id: "pregnancy",
    label: "Embarazo o lactancia",
  },
  {
    id: "kidney",
    label: "Tengo una condición o enfermedad renal",
  },
  {
    id: "liver",
    label: "Tengo una condición o enfermedad hepática",
  },
  {
    id: "medications",
    label: "Tomo medicamentos de forma regular",
  },
  {
    id: "medical",
    label: "Tengo alguna condición médica relevante",
  },
];

export default function ProfileQuestionnaire() {
  const [currentStep, setCurrentStep] = useState(0);

  const [answers, setAnswers] = useState<Answers>({
  goal: null,
  trainingDays: null,
  trainingType: null,
  duration: null,
  sweatLevel: null,
  heatTraining: null,
  proteinMeals: null,
  fattyFish: null,
  outdoorTime: null,
  currentSupplements: [],
  safetyFlags: [],
});
const [results, setResults] = useState<Recommendation[] | null>(null);

  const questions = [
    {
      key: "goal" as keyof Answers,
      eyebrow: "TU OBJETIVO",
      title: "¿Qué quieres conseguir principalmente?",
      description:
        "Selecciona el objetivo que mejor represente tu prioridad actual.",
      options: goals,
    },
    {
      key: "trainingDays" as keyof Answers,
      eyebrow: "FRECUENCIA",
      title: "¿Cuántos días entrenas por semana?",
      description:
        "Esto nos ayuda a entender la frecuencia de tu actividad física.",
      options: trainingDays,
    },
    {
      key: "trainingType" as keyof Answers,
      eyebrow: "ENTRENAMIENTO",
      title: "¿Qué tipo de entrenamiento realizas principalmente?",
      description:
        "Selecciona la actividad que mejor represente tu entrenamiento habitual.",
      options: trainingTypes,
    },
    {
      key: "duration" as keyof Answers,
      eyebrow: "DURACIÓN",
      title: "¿Cuánto dura normalmente una sesión?",
      description:
        "Considera la duración de una sesión habitual, no la más larga.",
      options: durations,
    },
    {
      key: "sweatLevel" as keyof Answers,
      eyebrow: "HIDRATACIÓN",
      title: "¿Cuánto sueles sudar durante el entrenamiento?",
      description:
        "No tiene que ser exacto. Selecciona la opción que mejor describa tu experiencia.",
      options: sweatLevels,
    },
    {
    key: "heatTraining" as keyof Answers,
    eyebrow: "ENTORNO",
    title: "¿Entrenas habitualmente en condiciones de calor?",
    description:
        "El entorno puede modificar las necesidades de hidratación durante el ejercicio.",
    options: heatTraining,
    },
    {
    key: "proteinMeals" as keyof Answers,
    eyebrow: "ALIMENTACIÓN",
    title: "¿Cuántas comidas al día contienen una fuente importante de proteína?",
    description:
        "Por ejemplo: carne, pescado, huevos, lácteos, legumbres u otras fuentes de proteína.",
    options: proteinMeals,
    },
    {
    key: "fattyFish" as keyof Answers,
    eyebrow: "ALIMENTACIÓN",
    title: "¿Con qué frecuencia consumes pescado graso?",
    description:
        "Por ejemplo: sardina, salmón, arenque o caballa.",
    options: fattyFish,
    },
    {
    key: "outdoorTime" as keyof Answers,
    eyebrow: "HÁBITOS",
    title: "¿Cuánto tiempo pasas habitualmente al aire libre durante el día?",
    description:
        "Esta respuesta solamente aporta contexto y no determina tu estado de vitamina D.",
    options: outdoorTime,
    },
    {
    key: "currentSupplements" as keyof Answers,
    eyebrow: "SUPLEMENTACIÓN",
    title: "¿Cuál de estos suplementos consumes actualmente?",
    description:
        "Esto nos ayudará a evitar sugerencias innecesariamente duplicadas.",
    options: currentSupplements,
    multiple: true,
    },
    {
    key: "safetyFlags" as keyof Answers,
    eyebrow: "SEGURIDAD",
    title: "Antes de generar tu perfil...",
    description:
        "Selecciona todas las opciones que correspondan. Esta información se utiliza únicamente para determinar si una recomendación automatizada es apropiada.",
    options: safetyOptions,
    multiple: true,
    },
  ];

  const question = questions[currentStep];
  const selectedValue = answers[question.key];
  const hasAnswer = Array.isArray(selectedValue)
  ? selectedValue.length > 0
  : Boolean(selectedValue);
  function selectAnswer(value: string) {
    if (
        question.key === "currentSupplements" ||
        question.key === "safetyFlags"
    ) {
        setAnswers((previousAnswers) => {
        const current = previousAnswers[question.key] as string[];

        if (value === "none") {
            return {
            ...previousAnswers,
            [question.key]: ["none"],
            };
        }

        const withoutNone = current.filter((item) => item !== "none");

        const alreadySelected = withoutNone.includes(value);

        return {
            ...previousAnswers,
            [question.key]: alreadySelected
            ? withoutNone.filter((item) => item !== value)
            : [...withoutNone, value],
        };
        });

        return;
    }

    setAnswers((previousAnswers) => ({
        ...previousAnswers,
        [question.key]: value,
    }));
    }

  function nextStep() {
    if (!hasAnswer) return;

    if (currentStep < questions.length - 1) {
        setCurrentStep((step) => step + 1);
    } else {
        const recommendations = generateRecommendations(answers);
        setResults(recommendations);
    }
}

  function previousStep() {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  }

  const progress = ((currentStep + 1) / questions.length) * 100;
  if (results) {
  return (
    <ResultsScreen
      results={results}
      onRestart={() => {
        setResults(null);
        setCurrentStep(0);
      }}
    />
  );
    }
  
  return (
    <section className="min-h-screen bg-[#F2EBDD] px-6 py-16 text-[#20201D]">
      <div className="mx-auto max-w-4xl">

        <div className="mb-12 flex items-center justify-between">
          <p className="text-sm font-bold tracking-[0.25em]">
            ORIGEN PROFILE
          </p>

          <p className="text-sm text-[#20201D]/50">
            {currentStep + 1} de {questions.length}
          </p>
        </div>

        <div className="mb-3 h-1 overflow-hidden rounded-full bg-[#20201D]/10">
          <div
            className="h-full rounded-full bg-[#68705A] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mb-12 text-xs text-[#20201D]/50">
          Perfil de entrenamiento
        </p>

        <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-[#68705A]">
          {question.eyebrow}
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          {question.title}
        </h1>

        <p className="mt-4 max-w-2xl text-[#20201D]/60">
          {question.description}
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {question.options.map((option) => {
            const isSelected = Array.isArray(selectedValue)
            ? selectedValue.includes(option.id)
            : selectedValue === option.id;

            return (
              <button
                key={option.id}
                onClick={() => selectAnswer(option.id)}
                className={`rounded-2xl border p-6 text-left transition ${
                  isSelected
                    ? "border-[#68705A] bg-[#68705A] text-white"
                    : "border-[#20201D]/10 bg-[#FAF8F2] hover:border-[#68705A]"
                }`}
              >
                <p className="font-semibold">
                  {option.label}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={previousStep}
            disabled={currentStep === 0}
            className={`text-sm font-semibold ${
              currentStep === 0
                ? "cursor-not-allowed text-[#20201D]/20"
                : "text-[#20201D]/60"
            }`}
          >
            ← Volver
          </button>

          <button
            onClick={nextStep}
            disabled={!hasAnswer}
            className={`rounded-full px-8 py-4 font-semibold transition ${
              hasAnswer
                ? "bg-[#20201D] text-[#FAF8F2] hover:scale-[1.02]"
                : "cursor-not-allowed bg-[#20201D]/15 text-[#20201D]/35"
            }`}
          >
            {currentStep === questions.length - 1
              ? "Ver resultados →"
              : "Continuar →"}
          </button>
        </div>

      </div>
    </section>
  );
}
type ResultsScreenProps = {
  results: Recommendation[];
  onRestart: () => void;
};

function ResultsScreen({
  results,
  onRestart,
}: ResultsScreenProps) {
  const statusLabels = {
    RELEVANT: "Alta relevancia",
    POSSIBLY_USEFUL: "Podría ser útil",
    LOW_RELEVANCE: "Baja relevancia",
    DIETARY_FIRST: "Alimentación primero",
    INSUFFICIENT_INFORMATION: "Necesitamos más información",
    ALREADY_USING: "Ya lo utilizas",
    PROFESSIONAL_REVIEW: "Revisión profesional",
  };

  return (
    <section className="min-h-screen bg-[#F2EBDD] px-6 py-16 text-[#20201D]">
      <div className="mx-auto max-w-5xl">

        <p className="mb-4 text-sm font-bold tracking-[0.25em] text-[#68705A]">
          YOUR ORIGEN PROFILE
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Tu perfil está listo.
        </h1>

        <p className="mt-5 max-w-2xl leading-7 text-[#20201D]/60">
          Analizamos tus respuestas para identificar qué suplementos podrían
          tener mayor relevancia según tu contexto.
        </p>

        <div className="mt-12 grid gap-5">
          {results.map((result) => (
            <article
              key={result.key}
              className="rounded-3xl border border-[#20201D]/10 bg-[#FAF8F2] p-7 md:p-8"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">

                <div>
                  <p className="mb-2 text-xs font-bold tracking-[0.18em] text-[#68705A]">
                    {statusLabels[result.status]}
                  </p>

                  <h2 className="text-2xl font-bold">
                    {result.supplement}
                  </h2>
                </div>

                {result.score !== null && (
                  <div className="rounded-full bg-[#F2EBDD] px-4 py-2 text-sm font-semibold">
                    Relevancia: {result.score}
                  </div>
                )}

              </div>

              <div className="mt-6 border-t border-[#20201D]/10 pt-6">

                <p className="mb-3 text-sm font-semibold">
                  ¿Por qué aparece en tu perfil?
                </p>

                <ul className="space-y-2">
                  {result.reasons.map((reason) => (
                    <li
                      key={reason}
                      className="flex gap-3 text-sm leading-6 text-[#20201D]/65"
                    >
                      <span className="text-[#68705A]">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>

              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">

          <button
            onClick={onRestart}
            className="rounded-full border border-[#20201D] px-7 py-3 font-semibold"
          >
            Repetir evaluación
          </button>

          <a
            href="/"
            className="rounded-full bg-[#20201D] px-7 py-3 text-center font-semibold text-[#FAF8F2]"
          >
            Explorar Origen Verified
          </a>

        </div>

        <p className="mt-10 max-w-3xl text-xs leading-5 text-[#20201D]/45">
          Los resultados de Origen Profile tienen fines educativos y no
          constituyen diagnóstico, tratamiento ni una recomendación médica
          individualizada.
        </p>

      </div>
    </section>
  );
}