import type { Prisma } from "@prisma/client";

function slugifyBase(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return s || "expert-advisor";
}

export function buildEaSlugBase(title: string): string {
  const base = slugifyBase(title);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`;
}

export async function uniqueEaSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  let slug = base.slice(0, 120);
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const ex = await tx.sharedExpertAdvisor.findUnique({ where: { slug: candidate } });
    if (!ex) return candidate;
    n += 1;
  }
}
