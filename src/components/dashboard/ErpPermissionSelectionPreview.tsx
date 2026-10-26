"use client";
import { useState } from "react";
import { pick, type Locale } from "@/lib/i18n";
import { uiPermissions } from "@/lib/erp-ui-permissions";
import { ErpPermissionPicker } from "./ErpPermissionPicker";

export function ErpPermissionSelectionPreview({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  return (
    <div className="erp-permission-selection-preview" data-permission-selection-preview>
      <h4>{t("Temporary permission selection", "اختيار صلاحيات مؤقت")}</h4>
      <p>
        {t(
          "Explore the grouped frontend catalogue. Confirm updates only this local summary; it assigns no user or role and changes no enforcement.",
          "استعرض دليل الواجهة المجمع. يؤثر التأكيد في هذا الملخص المحلي فقط؛ لا يعين مستخدماً أو دوراً ولا يغير التفويض.",
        )}
      </p>
      <button type="button" className="btn btn-outline" onClick={() => setOpen(true)}>
        {t("Select UI permissions — preview", "اختيار صلاحيات الواجهة — معاينة")}
      </button>
      <p role="status">
        {selected.length}{" "}
        {t("temporary definitions selected — not grants", "تعريفات مختارة مؤقتاً — ليست منحاً")}
      </p>
      {selected.length ? (
        <details>
          <summary>{t("Inspect confirmed preview summary", "فحص ملخص المعاينة المؤكد")}</summary>
          <ul className="erp-permission-summary">
            {uiPermissions
              .filter((p) => selected.includes(p.id))
              .map((permission) => (
                <li key={permission.id}>
                  {pick(permission.label, locale)}
                  <bdi dir="ltr">{permission.id}</bdi>
                </li>
              ))}
          </ul>
        </details>
      ) : null}
      {open ? (
        <ErpPermissionPicker
          locale={locale}
          initialSelected={selected}
          context={t("Unassigned selection sandbox", "مساحة اختيار غير معينة")}
          onCancel={() => setOpen(false)}
          onConfirm={(ids) => {
            setSelected(ids);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
