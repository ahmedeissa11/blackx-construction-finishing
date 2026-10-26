/** UI preference only: never used for authentication, authorization or application data. */
export type AdminTheme = "light" | "dark";
export const ADMIN_THEME_KEY = "blackx.admin.theme";
export function isAdminTheme(value: unknown): value is AdminTheme {
  return value === "light" || value === "dark";
}
export function resolveAdminTheme(value: unknown, systemDark: boolean): AdminTheme {
  return isAdminTheme(value) ? value : systemDark ? "dark" : "light";
}

/** Parser-executed before shell markup: saved choice wins before first paint.
 * Keep self-contained, constant and free of user/server data. Client navigation
 * is handled by the same provider in a layout effect. No inline style injection.
 */
export const adminThemeBootstrap = `(function(){var s=document.currentScript,r=s&&s.parentElement;if(!r)return;var p;try{p=localStorage.getItem(${JSON.stringify(ADMIN_THEME_KEY)})}catch(e){}var d=false;try{d=matchMedia('(prefers-color-scheme: dark)').matches}catch(e){}r.dataset.adminTheme=p==='light'||p==='dark'?p:d?'dark':'light'})()`;
