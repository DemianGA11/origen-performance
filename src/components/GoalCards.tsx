const goals = [
  {
    name: "BUILD",
    title: "Fuerza y músculo",
    description:
      "Productos seleccionados para complementar objetivos de fuerza, rendimiento y desarrollo muscular.",
  },
  {
    name: "ENDURE",
    title: "Resistencia",
    description:
      "Nutrición e hidratación para running, ciclismo y sesiones prolongadas.",
  },
  {
    name: "RECOVER",
    title: "Recuperación",
    description:
      "Opciones orientadas a complementar descanso, nutrición y recuperación.",
  },
  {
    name: "NOURISH",
    title: "Nutrición diaria",
    description:
      "Alimentos y suplementos seleccionados por ingredientes, procedencia y transparencia.",
  },
];

export default function GoalCards() {
  return (
    <section id="goals" className="bg-[#FAF8F2] px-6 py-24">
      <div className="mx-auto max-w-7xl">

        <div className="mb-14">
          <p className="mb-3 text-sm font-semibold tracking-[0.25em] text-[#68705A]">
            SHOP BY GOAL
          </p>

          <h2 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            Empieza por lo que quieres conseguir.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {goals.map((goal, index) => (
            <article
              key={goal.name}
              className="group flex min-h-[330px] flex-col justify-between rounded-3xl border border-[#20201D]/10 bg-[#F2EBDD] p-7 transition duration-300 hover:-translate-y-1"
            >
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-[0.25em] text-[#68705A]">
                    {goal.name}
                  </span>

                  <span className="text-sm text-[#20201D]/40">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="mb-4 text-2xl font-bold">
                  {goal.title}
                </h3>

                <p className="leading-7 text-[#20201D]/65">
                  {goal.description}
                </p>
              </div>

              <button className="mt-8 text-left text-sm font-semibold">
                Explorar →
              </button>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}