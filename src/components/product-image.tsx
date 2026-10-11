import Image from "next/image";

// Shows the product photo when one exists; otherwise a quiet typographic tile so
// the grid still looks finished before photography is uploaded.
export function ProductImage({
  src,
  alt,
  priority = false,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  className = "",
}: {
  src?: string | null;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={`object-cover transition duration-700 ease-[var(--ease-lux)] ${className}`}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`${alt} (image coming soon)`}
      className={`absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_#2a2620,_#141210_70%)] ${className}`}
    >
      <span className="font-display text-5xl tracking-[0.3em] text-gold/30">A</span>
    </div>
  );
}
