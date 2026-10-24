import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { getReviewSession, signIn } from "@/auth";
import { getAppDictionary } from "@/content/app-dictionary";
import { otherLocale, switchLocalePath } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getLoginRateLimitKey, isAdminAuthConfigured, isLoginRateLimited } from "@/lib/admin-auth";
import { OWNER_REVIEW_ROLE, sanitizeReviewCallbackUrl } from "@/lib/review-auth-shared";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return {
    title: getAppDictionary(locale).auth.title,
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const locale = await resolveLocale(params);
  const query = await searchParams;
  const app = getAppDictionary(locale);
  const callbackUrl = sanitizeReviewCallbackUrl(firstValue(query.callbackUrl), locale);
  const error = firstValue(query.error);
  const configured = isAdminAuthConfigured();
  const session = await getReviewSession();

  if (session?.user?.role === OWNER_REVIEW_ROLE) {
    redirect(callbackUrl);
  }

  async function loginAction(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const safeCallbackUrl = sanitizeReviewCallbackUrl(formData.get("callbackUrl"), locale);
    const loginPath = (errorCode: string) =>
      `/${locale}/login?error=${errorCode}&callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;

    if (!isAdminAuthConfigured()) {
      redirect(loginPath("configuration"));
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 256) {
      redirect(loginPath("credentials"));
    }

    const requestHeaders = await headers();
    if (isLoginRateLimited(getLoginRateLimitKey(email, requestHeaders))) {
      redirect(loginPath("rate-limited"));
    }

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: safeCallbackUrl,
      });
    } catch (cause) {
      if (cause instanceof AuthError) {
        redirect(loginPath("credentials"));
      }
      throw cause;
    }
  }

  const other = otherLocale(locale);
  const otherLoginHref = `/${other}/login?callbackUrl=${encodeURIComponent(switchLocalePath(callbackUrl, other))}`;
  const errorMessage =
    error === "configuration" || !configured
      ? app.auth.configurationMissing
      : error === "rate-limited"
        ? app.auth.rateLimited
        : error
          ? app.auth.invalidCredentials
          : null;

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <img src="/brand/blackx-logo.jpg" alt="BLACK X" width={48} height={48} />
          <div>
            <div className="auth-brand-name">BLACK X</div>
            <div className="auth-brand-sub">{app.auth.protectedArea}</div>
          </div>
        </div>

        <h1 id="auth-title">{app.auth.title}</h1>
        <p className="auth-lead">{app.auth.lead}</p>

        {errorMessage ? (
          <div className="alert alert-error" role="alert" style={{ marginBlockEnd: 18 }}>
            <span aria-hidden="true">!</span>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <form className="auth-form" action={loginAction}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="field">
            <label className="form-label" htmlFor="auth-email">
              {app.auth.email}
            </label>
            <input
              id="auth-email"
              className="form-input"
              name="email"
              type="email"
              autoComplete="username"
              required
              dir="ltr"
            />
          </div>
          <div className="field">
            <label className="form-label" htmlFor="auth-password">
              {app.auth.password}
            </label>
            <input
              id="auth-password"
              className="form-input"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              dir="ltr"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {app.auth.signIn}
          </button>
        </form>

        <div className="auth-links">
          <Link href={`/${locale}`}>{app.backToSite}</Link>
          <Link href={otherLoginHref}>{other === "ar" ? "عربي" : "English"}</Link>
        </div>
      </section>
    </main>
  );
}
