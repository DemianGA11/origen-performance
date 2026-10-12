
import type { Product } from "@/data/products";

type NutritionTableProps = {
  nutrition: Product["nutrition"];
};

export default function NutritionTable({
  nutrition,
}: NutritionTableProps) {
  if (!nutrition) {
    return (
      <div className="rounded-2xl border border-[#20201D]/10 bg-white/60 p-6">
        <p className="text-sm leading-6 text-[#20201D]/60">
          La información nutrimental detallada está pendiente
          de validación para este producto.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#20201D]/10 bg-white">
      <div className="border-b border-[#20201D]/10 bg-[#FAF8F2] p-6">
        <h3 className="text-xl font-bold text-[#20201D]">
          Información nutrimental
        </h3>

        <div className="mt-4 space-y-1 text-sm text-[#20201D]/65">
          <p>
            <strong>Tamaño de porción:</strong>{" "}
            {nutrition.servingSize}
          </p>

          <p>
            <strong>Porciones por envase:</strong>{" "}
            {nutrition.servingsPerContainer}
          </p>
        </div>
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-[#F2EBDD]">
          <tr>
            <th scope="col" className="px-6 py-4 font-semibold">
              Componente
            </th>
            <th
              scope="col"
              className="px-6 py-4 text-right font-semibold"
            >
              Por porción
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#20201D]/10">
          {nutrition.items.map((item, index) => (
            <tr key={`${item.label}-${index}`}>
              <td className="px-6 py-4 text-[#20201D]/75">
                {item.label}
              </td>
              <td className="px-6 py-4 text-right font-semibold text-[#20201D]">
                {item.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
