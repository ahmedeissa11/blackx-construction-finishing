import { notFound } from "next/navigation";

/**
 * Catch-all so unknown localized URLs render the custom [locale]/not-found
 * page instead of the framework default. Throwing in generateMetadata keeps
 * the decision before page rendering. Do not add a [locale]/loading.tsx
 * above this segment: its streaming Suspense shell sends HTTP 200 before
 * notFound() can set the real 404 status.
 */
export async function generateMetadata(): Promise<never> {
  notFound();
}
export default async function UnknownPath() {
  notFound();
}
