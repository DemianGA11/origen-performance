import Navbar from "@/components/Navbar";
import GoalCards from "@/components/GoalCards";
import FeaturedProducts from "@/components/FeaturedProducts";
import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-[#F2EBDD] text-[#20201D]">

        <Navbar />

      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        
        <p className="mb-4 text-sm font-semibold tracking-[0.3em] text-[#68705A]">
          ORIGEN PERFORMANCE
        </p>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
          Del origen a tu rendimiento.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-[#20201D]/70">
          Suplementos y alimentos seleccionados por su calidad,
          transparencia y procedencia.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <button className="rounded-full bg-[#20201D] px-8 py-4 font-semibold text-[#FAF8F2]">
            Explorar productos
          </button>

          <Link
            href="/profile"
            className="rounded-full border border-[#20201D] px-8 py-4 font-semibold transition hover:bg-[#20201D] hover:text-[#FAF8F2]">
            Crear mi Origen Profile
          </Link>
        </div>

      </section>
      <GoalCards />
      <FeaturedProducts />
    </main>
  );
}