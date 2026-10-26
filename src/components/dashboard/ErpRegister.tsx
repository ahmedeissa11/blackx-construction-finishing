"use client";
import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { erpFields, erpText } from "@/content/erp-dictionary";
import { getErpDataset, type ErpRow } from "@/lib/erp-data";
import { InfoDialog } from "@/components/ui/ConfirmDialog";

export function ErpRegister({ source, locale }: { source: string; locale: Locale }) {
  const data = getErpDataset(source, locale);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [entityFilters, setEntityFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState("asc");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<ErpRow | null>(null);
  if (!data) return <div className="empty-state">{erpText("unavailable", locale)}</div>;
  const types = [
    ...new Set(
      data.rows
        .map((row) => row.cells.status ?? row.cells.type)
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  const rangeInvalid = Boolean(from && to && from > to);
  const entityKeys = ["customer", "supplier", "project"].filter((key) =>
    data.columns.includes(key),
  );
  const dated = data.rows.some((row) => row.filterDate);
  const rows = data.rows
    .filter(
      (row) =>
        (!filter || row.cells.status === filter || row.cells.type === filter) &&
        entityKeys.every((key) => !entityFilters[key] || row.cells[key] === entityFilters[key]) &&
        (!dated ||
          ((!from || Boolean(row.filterDate && row.filterDate >= from)) &&
            (!to || Boolean(row.filterDate && row.filterDate <= to)))) &&
        !rangeInvalid &&
        Object.values(row.cells).join(" ").toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => (sort === "asc" ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id)));
  const page = Math.min(offset, Math.max(0, Math.ceil(rows.length / 10) - 1));
  const field = (key: string) => erpFields[key]?.[locale] ?? key;
  return (
    <section className="panel erp-register">
      <div className="erp-filterbar">
        <label>
          {erpText("search", locale)}
          <input
            className="form-input"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOffset(0);
            }}
          />
        </label>
        {types.length ? (
          <label>
            {erpText("filter", locale)}
            <select
              className="form-select"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setOffset(0);
              }}
            >
              <option value="">{erpText("all", locale)}</option>
              {types.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        ) : null}
        {entityKeys.map((key) => (
          <label key={key}>
            {field(key)}
            <select
              className="form-select"
              value={entityFilters[key] ?? ""}
              onChange={(e) => {
                setEntityFilters((values) => ({ ...values, [key]: e.target.value }));
                setOffset(0);
              }}
            >
              <option value="">{erpText("all", locale)}</option>
              {[...new Set(data.rows.map((row) => row.cells[key]).filter(Boolean))]
                .sort()
                .map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
            </select>
          </label>
        ))}
        {dated ? (
          <>
            {(["from", "to"] as const).map((key) => (
              <label key={key}>
                {locale === "ar"
                  ? key === "from"
                    ? "من تاريخ العينة"
                    : "إلى تاريخ العينة"
                  : key === "from"
                    ? "Fixture start date"
                    : "Fixture end date"}
                <input
                  className="form-input"
                  type="date"
                  value={key === "from" ? from : to}
                  aria-invalid={rangeInvalid || undefined}
                  onChange={(e) => {
                    (key === "from" ? setFrom : setTo)(e.target.value);
                    setOffset(0);
                  }}
                />
              </label>
            ))}
          </>
        ) : null}
        <label>
          {erpText("sort", locale)}
          <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="asc">{erpText("ascending", locale)}</option>
            <option value="desc">{erpText("descending", locale)}</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => {
          setQuery("");
          setFilter("");
          setFrom("");
          setTo("");
          setEntityFilters({});
          setOffset(0);
        }}
      >
        {locale === "ar" ? "مسح مرشحات العينات" : "Clear fixture filters"}
      </button>
      {rangeInvalid ? (
        <p role="alert">
          {locale === "ar"
            ? "يجب ألا يسبق تاريخ النهاية تاريخ البداية."
            : "End date must not precede start date."}
        </p>
      ) : null}
      <p className="erp-result-count" role="status">
        {rows.length} {erpText("count", locale)}
      </p>
      <div
        className="erp-table-scroll"
        role="region"
        aria-label={erpText("preview", locale)}
        tabIndex={0}
      >
        <table>
          <caption className="sr-only">{erpText("preview", locale)}</caption>
          <thead>
            <tr>
              {data.columns.map((column) => (
                <th scope="col" key={column}>
                  {field(column)}
                </th>
              ))}
              <th scope="col">{erpText("inspect", locale)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(page * 10, page * 10 + 10).map((row) => (
              <tr key={row.id}>
                {data.columns.map((column) => (
                  <td
                    key={column}
                    dir={
                      ["ref", "project", "phase", "phone", "payment", "contract"].includes(column)
                        ? "ltr"
                        : undefined
                    }
                  >
                    {column === "status" ? (
                      <span className="badge badge-neutral">{row.cells[column]}</span>
                    ) : (
                      row.cells[column]
                    )}
                  </td>
                ))}
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-label={`${erpText("inspect", locale)} ${row.id}`}
                    onClick={() => setSelected(row)}
                  >
                    {erpText("inspect", locale)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <div className="empty-state">{erpText("noResults", locale)}</div> : null}
      <div className="erp-pagination">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={page === 0}
          onClick={() => setOffset(page - 1)}
        >
          {erpText("previous", locale)}
        </button>
        <span>
          {page + 1} / {Math.max(1, Math.ceil(rows.length / 10))}
        </span>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={(page + 1) * 10 >= rows.length}
          onClick={() => setOffset(page + 1)}
        >
          {erpText("next", locale)}
        </button>
      </div>
      <InfoDialog
        open={Boolean(selected)}
        title={selected?.id ?? erpText("inspect", locale)}
        closeLabel={erpText("close", locale)}
        onClose={() => setSelected(null)}
      >
        <p>{erpText("preview", locale)}</p>
        <dl className="erp-detail-list">
          {selected
            ? Object.entries(selected.cells).map(([key, value]) => (
                <div key={key}>
                  <dt>{field(key)}</dt>
                  <dd>{value}</dd>
                </div>
              ))
            : null}
        </dl>
        {selected?.href ? (
          <Link className="btn btn-outline" href={selected.href}>
            {erpText("open", locale)}
          </Link>
        ) : null}
      </InfoDialog>
    </section>
  );
}
