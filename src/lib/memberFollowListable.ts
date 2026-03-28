import type { Prisma } from "@prisma/client";

/** Hanya member yang tampil di daftar publik (sama seperti halaman profil slug). */
export const listablePublicMemberWhere: Prisma.UserWhereInput = {
  memberStatus: "ACTIVE",
  profileComplete: true,
};
