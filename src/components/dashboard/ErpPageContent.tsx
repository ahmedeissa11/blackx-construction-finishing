import Link from "next/link";
import { ErpCostWorkbench } from "./ErpLocalWorkbenches";
import { ErpPageNavigator } from "./ErpPageNavigator";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { dashboardModules, dashboardHref } from "@/config/navigation";
import { erpHref, findErpPage, type ErpModule, type ErpPage } from "@/config/erp";
import { erpText, erpFields, erpKindLabel } from "@/content/erp-dictionary";
import { getAppDictionary } from "@/content/app-dictionary";
import { previewRequests } from "@/content/preview-data";
import { DomainBoard, type DomainBoardModuleKey } from "./DomainBoards";
import { ExpansionBoard, type ExpansionModuleKey } from "./ExpansionBoards";
import { RequestsBoard } from "./RequestsBoard";
import { ErpAccessMatrix } from "./ErpAccessMatrix";
import { ErpScreenPreview } from "./ErpScreenPreview";
import { getScreenViews } from "@/config/erp-screen-specs";
import { ErpRegister } from "./ErpRegister";
import { ErpImportValidator, ErpExport } from "./ErpTools";

const domainKeys: readonly string[] = [
  "customers",
  "inspections",
  "quotations",
  "contracts",
  "projects",
  "milestones",
  "diary",
  "progress",
  "issues",
  "quality",
  "reports",
  "documents",
  "handover",
  "warranty",
  "notifications",
  "audit",
];
const expansionKeys: readonly string[] = [
  "engineers",
  "finance",
  "purchases",
  "complaints",
  "messages",
];
export type ErpDiagnostics = {
  role: string;
  adapter: "active" | "unconfigured" | "refused";
  implemented: string[];
  readOnly: string[];
  planned: string[];
};
function Dependencies({ locale }: { locale: Locale }) {
  return (
    <aside className="panel erp-tool">
      <h3>{erpText("dependency", locale)}</h3>
      <ol>
        {(["service", "rules", "access"] as const).map((key) => (
          <li key={key}>{erpText(key, locale)}</li>
        ))}
      </ol>
    </aside>
  );
}
function ExistingView({ source, locale }: { source: string; locale: Locale }) {
  const areaModule = dashboardModules.find((item) => item.key === source);
  const app = getAppDictionary(locale);
  if (!areaModule) return <p>{erpText("unavailable", locale)}</p>;
  return (
    <>
      <div className="panel erp-source">
        <p>{erpText("sourceNote", locale)}</p>
        <Link className="btn btn-outline" href={dashboardHref(locale, areaModule.segment)}>
          {erpText("open", locale)}: {app.dashboard.modules[areaModule.key]}
        </Link>
      </div>
      {domainKeys.includes(source) ? (
        <DomainBoard locale={locale} appDict={app} moduleKey={source as DomainBoardModuleKey} />
      ) : expansionKeys.includes(source) ? (
        <ExpansionBoard locale={locale} appDict={app} moduleKey={source as ExpansionModuleKey} />
      ) : source === "requests" ? (
        <RequestsBoard locale={locale} appDict={app} initialRequests={previewRequests} />
      ) : null}
    </>
  );
}
function Configuration({ page, locale }: { page: ErpPage; locale: Locale }) {
  const policy: Record<string, [string, string]> = {
    general: [
      "Brand and single-workspace configuration are managed server-side, not editable here.",
      "العلامة وإعداد مساحة العمل الواحدة تدار من الخادم ولا تعدل هنا.",
    ],
    localization: [
      "Arabic uses RTL and English uses LTR. Use the header language switch; no preference is persisted.",
      "العربية من اليمين لليسار والإنجليزية من اليسار لليمين؛ استخدم مفتاح اللغة في الرأس دون حفظ تفضيلات.",
    ],
    modules: [
      "Module availability is an interface registry, not authorization or backend readiness.",
      "توفر الوحدة يعبر عن دليل واجهات وليس عن تفويض أو جاهزية خدمة خلفية.",
    ],
    notifications: [
      "Delivery channels, event rules and providers require a verified transport service.",
      "قنوات الإرسال وقواعد الأحداث والمزودون تتطلب خدمة نقل متحققة.",
    ],
    documents: [
      "Upload authorization, attachment limits, storage and malware scanning require a document service.",
      "تفويض الرفع وحدود المرفقات والتخزين وفحص الملفات تتطلب خدمة مستندات.",
    ],
    operations: [
      "Workflow transition functions exist, but approval authority and persistence are not enabled by this screen.",
      "توجد دوال انتقال للحالات لكن هذه الشاشة لا تفعل صلاحيات الاعتماد أو الحفظ.",
    ],
    maintenance: [
      "Maintenance operations cannot be performed from this interface.",
      "لا تنفذ عمليات صيانة من هذه الواجهة.",
    ],
  };
  const note = policy[page.id];
  return (
    <section className="panel erp-tool">
      <h3>{pick(page.title, locale)}</h3>
      <p>{erpText("settings", locale)}</p>
      {note ? <p className="erp-boundary">{locale === "ar" ? note[1] : note[0]}</p> : null}
      <dl className="erp-detail-list">
        <div>
          <dt>{erpText("view", locale)}</dt>
          <dd>{erpText("owner", locale)}</dd>
        </div>
        <div>
          <dt>{erpText("edit", locale)}</dt>
          <dd>{erpText("pending", locale)}</dd>
        </div>
      </dl>
    </section>
  );
}
export function ErpPageContent({
  module,
  page,
  locale,
  diagnostics,
  screenView,
}: {
  module: ErpModule;
  page: ErpPage;
  locale: Locale;
  diagnostics: ErpDiagnostics;
  screenView?: string;
}) {
  const source = page.source;
  const identityPreview = getScreenViews(module.id, page.id).some(
    (view) => view.id === "users" || view.id === "roles",
  );
  const shared = page.sharedWith
    ? findErpPage(page.sharedWith.area, page.sharedWith.page)
    : undefined;
  const related = (page.related ?? []).flatMap((ref) => {
    const match = findErpPage(ref.area, ref.page);
    return match ? [match] : [];
  });
  return (
    <article className={`erp-workspace erp-domain-${module.id}`}>
      <header className="erp-intro">
        <span className="erp-eyebrow">
          {pick(module.title, locale)} / {pick(page.section, locale)}
        </span>
        <h2>{pick(page.title, locale)}</h2>
        <p>{pick(module.boundary, locale)}</p>
        <p className="erp-boundary" data-erp-scope>
          {pick(page.summary, locale)}
        </p>
        <div className="erp-actions">
          <span className="badge badge-neutral">{erpKindLabel(page.kind, locale)}</span>
          <Link className="btn btn-ghost btn-sm" href={erpHref(locale, module.id)}>
            {erpText("catalogue", locale)}
          </Link>
        </div>
        <small>{erpText("proposed", locale)}</small>
      </header>
      <ErpPageNavigator module={module} pageId={page.id} locale={locale} />
      <ErpScreenPreview
        key={`${module.id}/${page.id}/${screenView ?? "default"}`}
        area={module.id}
        page={page.id}
        locale={locale}
        initialView={screenView}
      />
      {module.id === "sales" && page.id === "boq" ? (
        <ErpCostWorkbench locale={locale} mode="boq" />
      ) : null}
      {page.kind === "shared" ? (
        <section className="panel erp-tool" data-erp-shared>
          <h3>
            {locale === "ar"
              ? "مدخل لمساحة مشتركة وليس سجلاً مستقلاً"
              : "Entry to a shared workspace, not a separate register"}
          </h3>
          <p>
            {identityPreview
              ? locale === "ar"
                ? "المصدر أدناه مرجع مشترك منفصل عن دليل المعاينة الاصطناعي أعلاه. التعيينات المحلية لا تنتقل بين المسارات ولا تغير التفويض أو المصدر المشترك."
                : "The link below is a shared reference, separate from the synthetic directory above. Local assignments do not transfer between routes or change authorization or the shared source."
              : locale === "ar"
                ? "لم تُكرر الشاشة هنا. افتح المصدر أدناه؛ تبقى بياناته توضيحية أو محلية وليست عملية دائمة."
                : "The screen is not duplicated here. Open its source below; its data remains illustrative or local, not a durable operation."}
          </p>
          {shared ? (
            <Link
              className="btn btn-outline"
              href={erpHref(locale, shared.module.id, shared.page.id)}
            >
              {pick(shared.page.title, locale)}
            </Link>
          ) : (
            <p>{erpText("unavailable", locale)}</p>
          )}
        </section>
      ) : page.kind === "instructions" ? (
        <section className="panel erp-tool" data-erp-instructions>
          <h3>{locale === "ar" ? "صيغة التحقق المحلية فقط" : "Local validation format only"}</h3>
          <p>{erpText("importHelp", locale)}</p>
          <pre dir="ltr">{'[{"reference":"EXAMPLE-1","name":"Example only"}]'}</pre>
          <p>
            {locale === "ar"
              ? "مثال صيغة فقط وليس سجل أعمال. النتائج مؤقتة في صفحة التحقق ولا تنتقل بين المسارات."
              : "Format example only, not a business record. Results exist temporarily on the validator page and do not transfer between routes."}
          </p>
          <Link className="btn btn-outline" href={erpHref(locale, "data", "validation")}>
            {erpText("validate", locale)}
          </Link>
        </section>
      ) : source?.startsWith("link:") ? (
        <ExistingView source={source.slice(5)} locale={locale} />
      ) : source?.startsWith("data:") ? (
        <ErpRegister key={`${module.id}/${page.id}`} source={source.slice(5)} locale={locale} />
      ) : source === "permissions" ? (
        <ErpAccessMatrix locale={locale} />
      ) : source === "settings" ? (
        <Configuration page={page} locale={locale} />
      ) : source === "diagnostics" ? (
        <section className="panel erp-tool">
          <h3>{erpText("health", locale)}</h3>
          <p>
            {locale === "ar"
              ? "لا توجد وصلة بيانات دائمة مسجلة؛ المحول التجريبي إن فُعل فهو مؤقت ومرفوض في الإنتاج."
              : "No durable data adapter is registered. The fake adapter, when selected, is temporary and refused in production."}
          </p>
          <dl className="erp-detail-list">
            <div>
              <dt>{erpText("role", locale)}</dt>
              <dd>
                <code>{diagnostics.role}</code>
              </dd>
            </div>
            <div>
              <dt>{erpText("adapter", locale)}</dt>
              <dd>
                {erpText(
                  diagnostics.adapter === "active" ? "configured" : diagnostics.adapter,
                  locale,
                )}
              </dd>
            </div>
          </dl>
          <h4>{erpText("contract", locale)}</h4>
          <p>
            {locale === "ar"
              ? "حالة التنفيذ في الشيفرة، وليست إثبات اتصال بخدمة حية."
              : "Implementation status in code, not evidence of a live connected service."}
          </p>
          <div className="erp-readiness">
            <div>
              <h4>{locale === "ar" ? "منفذ في الأساس" : "Implemented in foundation"}</h4>
              <p>{diagnostics.implemented.join(" · ")}</p>
            </div>
            <div>
              <h4>{locale === "ar" ? "قراءة فقط" : "Read-only contracts"}</h4>
              <p>{diagnostics.readOnly.join(" · ")}</p>
            </div>
            <div>
              <h4>{erpText("deferred", locale)}</h4>
              <p>{diagnostics.planned.join(" · ")}</p>
            </div>
          </div>
        </section>
      ) : source === "import" ? (
        <ErpImportValidator key={page.id} locale={locale} />
      ) : source === "export" ? (
        <ErpExport locale={locale} role={diagnostics.role} />
      ) : (
        <>
          <section className="panel erp-tool" data-erp-deferred={`${module.id}/${page.id}`}>
            <h3>
              {locale === "ar"
                ? `غير منفذ: ${pick(page.subject, locale)}`
                : `Not implemented: ${pick(page.subject, locale)}`}
            </h3>
            <p>{pick(page.summary, locale)}</p>
            <p>
              {locale === "ar"
                ? "لا توجد سجلات معتمدة متصلة أو إجراءات تشغيل لهذه الميزة. عدم عرض بيانات لا يعني رصيداً صفرياً أو نجاح عملية."
                : "There are no connected authoritative records or operational actions for this feature. Missing data does not imply a zero balance or a successful operation."}
            </p>
            {!getScreenViews(module.id, page.id).length ? (
              <>
                <h4>{erpText("fields", locale)}</h4>
                <ul>
                  {page.fields.map((field) => (
                    <li key={field}>{erpFields[field]?.[locale] ?? field}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="erp-boundary">{erpText("deferred", locale)}</p>
          </section>
          <Dependencies locale={locale} />
        </>
      )}
      {related.length ? (
        <section className="panel erp-tool">
          <h3>{erpText("linked", locale)}</h3>
          <div className="erp-related">
            {related.map(({ module: relatedModule, page: item }) => (
              <Link key={item.id} href={erpHref(locale, relatedModule.id, item.id)}>
                {pick(item.title, locale)}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
