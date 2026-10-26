import type { ReactNode } from "react";

/** Shared Admin composition, independent of data, permissions and theme preference. */
export function ErpPageHeader({
  title,
  eyebrow,
  description,
  actions,
  status,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`erp-page-header ${className}`}>
      <div className="erp-page-heading">
        {eyebrow ? <p className="erp-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <div className="erp-page-description">{description}</div> : null}
      </div>
      {actions || status ? (
        <div className="erp-page-header-actions">
          {status}
          {actions}
        </div>
      ) : null}
      {children ? <div className="erp-page-header-context">{children}</div> : null}
    </header>
  );
}

export function ErpFormSection({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={`erp-form-section ${className}`}>
      <legend>{title}</legend>
      {description ? <p className="erp-form-section-note">{description}</p> : null}
      <div className="erp-form-fields">{children}</div>
    </fieldset>
  );
}

export function ErpTableRegion({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`erp-table-region erp-table-scroll ${className}`}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export function ErpTableToolbar({
  label,
  children,
  actions,
}: {
  label: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="erp-data-toolbar" aria-label={label}>
      <div className="erp-data-filters">{children}</div>
      {actions ? <div className="erp-data-toolbar-actions">{actions}</div> : null}
    </section>
  );
}
