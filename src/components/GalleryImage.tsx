import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** Kelas untuk wrapper (aspect / rounded) */
  wrapperClassName?: string;
  fill?: boolean;
};

/** Gambar galeri: `next/image` untuk aset lokal `/...`, `<img>` untuk URL eksternal (tanpa remotePatterns). */
export function GalleryImage({ src, alt, className, wrapperClassName, fill = true }: Props) {
  const local = src.startsWith("/");

  if (local) {
    return (
      <div className={wrapperClassName ?? "relative aspect-video w-full overflow-hidden"}>
        <Image
          src={src}
          alt={alt}
          fill={fill}
          className={className ?? "object-cover"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className ?? "aspect-video w-full object-cover"} />
  );
}
