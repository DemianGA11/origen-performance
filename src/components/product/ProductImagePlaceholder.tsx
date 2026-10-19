type ProductImagePlaceholderProps = {
  name: string;
};

export default function ProductImagePlaceholder({ name }: ProductImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`${name}: fotografía no disponible`}
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#F2EBDD] p-3 text-center text-[#68705A]"
    >
      <span aria-hidden="true" className="text-xs font-bold tracking-[0.18em]">
        ORIGEN
      </span>
      <span aria-hidden="true" className="text-[10px] leading-4">
        Fotografía próximamente
      </span>
    </div>
  );
}
