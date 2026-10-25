/**
 * List-query parsing for foundation endpoints (contract §1.6), following
 * the exact semantics already enforced by the intake admin reads:
 * unknown parameters are `400 INVALID_QUERY` (never silently ignored),
 * `page`/`pageSize` are digit-only with pageSize ≤ 100, `sort` is an
 * allow-listed field with optional `-` prefix (default descending on the
 * endpoint's primary timestamp), `search` is length-capped, and
 * `from`/`to` must parse and be ordered.
 */

import { ApiError } from "./errors";

const MAX_SEARCH_LENGTH = 200;
const MAX_FILTER_LENGTH = 200;

export interface ParsedListQuery {
  page: number;
  pageSize: number;
  sortField: string;
  direction: "asc" | "desc";
  search?: string;
  from?: string;
  to?: string;
  /** Validated endpoint-specific filters (enum-checked where declared). */
  filters: Record<string, string>;
}

export interface ListQuerySpec {
  /** Fields the endpoint allows in `sort` (with optional `-` prefix). */
  sortFields: readonly string[];
  /** Default sort field; default direction is `desc` (contract §1.6). */
  defaultSortField: string;
  /** Filter params accepted verbatim (non-empty, length-capped). */
  stringFilters?: readonly string[];
  /** Filter params validated against an enum allow-list. */
  enumFilters?: Readonly<Record<string, ReadonlySet<string>>>;
  /** Whether `from`/`to` date bounds are accepted. */
  dateRange?: boolean;
  /** Whether `search` is accepted. Default true. */
  search?: boolean;
}

function invalidQuery(): ApiError {
  return new ApiError("INVALID_QUERY");
}

export function parseListQuery(params: URLSearchParams, spec: ListQuerySpec): ParsedListQuery {
  const allowSearch = spec.search !== false;
  const allowedKeys = new Set<string>(["page", "pageSize", "sort"]);
  if (allowSearch) allowedKeys.add("search");
  if (spec.dateRange) {
    allowedKeys.add("from");
    allowedKeys.add("to");
  }
  for (const name of spec.stringFilters ?? []) allowedKeys.add(name);
  for (const name of Object.keys(spec.enumFilters ?? {})) allowedKeys.add(name);

  for (const key of new Set(params.keys())) {
    if (!allowedKeys.has(key)) throw invalidQuery();
  }

  const parseIntParam = (name: string, fallback: number): number => {
    const raw = params.get(name);
    if (raw === null) return fallback;
    if (!/^\d+$/.test(raw)) throw invalidQuery();
    return Number(raw);
  };
  const page = parseIntParam("page", 1);
  const pageSize = parseIntParam("pageSize", 20);
  if (page < 1 || pageSize < 1 || pageSize > 100) throw invalidQuery();

  const rawSort = params.get("sort") ?? `-${spec.defaultSortField}`;
  const direction = rawSort.startsWith("-") ? "desc" : "asc";
  const sortField = rawSort.startsWith("-") ? rawSort.slice(1) : rawSort;
  if (!spec.sortFields.includes(sortField)) throw invalidQuery();

  const filters: Record<string, string> = {};
  for (const name of spec.stringFilters ?? []) {
    const raw = params.get(name);
    if (raw === null || raw === "") continue;
    if (raw.length > MAX_FILTER_LENGTH) throw invalidQuery();
    filters[name] = raw;
  }
  for (const [name, allowed] of Object.entries(spec.enumFilters ?? {})) {
    const raw = params.get(name);
    if (raw === null || raw === "") continue;
    if (!allowed.has(raw)) throw invalidQuery();
    filters[name] = raw;
  }

  const result: ParsedListQuery = { page, pageSize, sortField, direction, filters };

  if (allowSearch) {
    const search = params.get("search");
    if (search !== null && search !== "") {
      if (search.length > MAX_SEARCH_LENGTH) throw invalidQuery();
      result.search = search;
    }
  }

  if (spec.dateRange) {
    const from = params.get("from") ?? undefined;
    const to = params.get("to") ?? undefined;
    for (const bound of [from, to]) {
      if (bound !== undefined && !Number.isFinite(Date.parse(bound))) throw invalidQuery();
    }
    if (from !== undefined && to !== undefined && Date.parse(from) > Date.parse(to)) {
      throw invalidQuery();
    }
    if (from !== undefined) result.from = from;
    if (to !== undefined) result.to = to;
  }

  return result;
}
