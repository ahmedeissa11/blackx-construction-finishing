import type { NextAuthConfig } from "next-auth";

const isProduction = process.env.NODE_ENV === "production";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/ar/login",
    error: "/ar/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-blackx-review-session" : "blackx-review-session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.role) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.role = token.role;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
