import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { authConfig } from "@/auth.config";
import { isAdminAuthConfigured, verifyOwnerCredentials } from "@/lib/admin-auth";
import { OWNER_REVIEW_ROLE } from "@/lib/review-auth-shared";
import type { Locale } from "@/lib/i18n";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Company owner review",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        return verifyOwnerCredentials({ email, password, headers: request.headers });
      },
    }),
  ],
});

export async function getReviewSession(): Promise<Session | null> {
  if (!isAdminAuthConfigured()) return null;
  return auth();
}

export async function requireReviewAccess(locale: Locale): Promise<Session> {
  if (!isAdminAuthConfigured()) {
    redirect(`/${locale}/login?error=configuration`);
  }

  const session = await auth();
  if (!session?.user || session.user.role !== OWNER_REVIEW_ROLE) {
    redirect(`/${locale}/login`);
  }

  return session;
}
