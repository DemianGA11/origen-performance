export default function Navbar() {
  return (
    <header className="absolute left-0 top-0 z-50 w-full">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-8">
        
        <div>
          <p className="text-lg font-bold tracking-[0.18em]">
            ORIGEN
          </p>
          <p className="text-[9px] font-semibold tracking-[0.35em] text-[#68705A]">
            PERFORMANCE
          </p>
        </div>

        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="#shop" className="transition-opacity hover:opacity-60">
            Shop
          </a>

          <a href="#goals" className="transition-opacity hover:opacity-60">
            Objetivos
          </a>

          <a href="#verified" className="transition-opacity hover:opacity-60">
            Origen Verified
          </a>

          <a href="#learn" className="transition-opacity hover:opacity-60">
            Aprende
          </a>
        </div>

        <button className="rounded-full border border-[#20201D] px-5 py-2 text-sm font-semibold transition hover:bg-[#20201D] hover:text-[#FAF8F2]">
          Mi perfil
        </button>

      </nav>
    </header>
  );
}