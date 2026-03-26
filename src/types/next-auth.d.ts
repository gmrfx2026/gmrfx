import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "USER" | "ADMIN";
      profileComplete: boolean;
    };
  }

  interface User {
    role?: "USER" | "ADMIN";
    profileComplete?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "USER" | "ADMIN";
    profileComplete?: boolean;
  }
}
