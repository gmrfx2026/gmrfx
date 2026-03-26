import Image from "next/image";

/** Avatar bulat kecil untuk daftar komentar / thread (±28px). */
export function SmallUserAvatar({
  name,
  image,
  size = "sm",
}: {
  name: string | null;
  image: string | null;
  size?: "sm" | "xs";
}) {
  const initial = (name ?? "?").slice(0, 1).toUpperCase();
  const box = size === "xs" ? "h-6 w-6" : "h-7 w-7";
  const textSize = size === "xs" ? "text-[8px]" : "text-[10px]";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-broker-border/40 bg-broker-surface ${box}`}
    >
      {image?.startsWith("/") ? (
        <Image src={image} alt="" fill className="object-cover" sizes="28px" unoptimized />
      ) : image ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL eksternal di luar remotePatterns
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-semibold text-broker-muted ${textSize}`}
        >
          {initial}
        </div>
      )}
    </div>
  );
}
