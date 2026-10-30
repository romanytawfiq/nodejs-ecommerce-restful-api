import type { QueryFilter, Model, SortOrder } from 'mongoose';

export interface ApiQuery {
  page?: string;
  limit?: string;
  sort?: string;
  select?: string;
  fields?: string;
  search?: string;
  populate?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

const FIELD_PATTERN = /^-?[A-Za-z0-9_.]+$/;

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Resolves `page` and `limit` from the query string.
 * `limit` is capped at {@link MAX_LIMIT} to protect the database.
 */
export const parsePagination = (query: ApiQuery): { page: number; limit: number; skip: number } => {
  const page = parsePositiveInt(query.page, DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, parsePositiveInt(query.limit, DEFAULT_LIMIT));
  return { page, limit, skip: (page - 1) * limit };
};

/**
 * Parses `sort=name,-createdAt` into a Mongoose sort object.
 * Fields outside `allowed` are ignored, so callers control what is sortable.
 */
export const parseSort = (sort: string | undefined, allowed: string[] = []): Record<string, SortOrder> | undefined => {
  if (!sort) return undefined;

  const parsed: Record<string, SortOrder> = {};
  for (const raw of sort.split(',')) {
    const token = raw.trim();
    if (!token) continue;

    const descending = token.startsWith('-');
    const field = descending ? token.slice(1) : token;
    if (!field || !FIELD_PATTERN.test(field)) continue;
    if (allowed.length > 0 && !allowed.includes(field)) continue;

    parsed[field] = descending ? -1 : 1;
  }

  return Object.keys(parsed).length > 0 ? parsed : undefined;
};

/**
 * Parses `select=name,slug,-description` (or `fields=...`) into a Mongoose
 * projection string. Fields outside `allowed` are ignored, so callers control
 * which fields can be returned.
 */
export const parseFields = (fields: string | undefined, allowed: string[] = []): string | undefined => {
  if (!fields) return undefined;

  const parsed = fields
    .split(',')
    .map((field) => field.trim())
    .filter((field) => {
      if (!FIELD_PATTERN.test(field)) return false;
      if (allowed.length === 0) return true;
      const name = field.startsWith('-') ? field.slice(1) : field;
      return allowed.includes(name);
    });

  return parsed.length > 0 ? parsed.join(' ') : undefined;
};

/**
 * Parses `populate=category,owner` into a list of paths to populate.
 */
export const parsePopulate = (populate: string | undefined): string[] => {
  if (!populate) return [];

  return populate
    .split(',')
    .map((path) => path.trim())
    .filter((path) => FIELD_PATTERN.test(path));
};

export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds a case-insensitive `$or` filter searching `search` across `fields`.
 */
export const buildSearchFilter = <T>(search: string | undefined, fields: string[]): QueryFilter<T> | undefined => {
  const term = search?.trim();
  if (!term || fields.length === 0) return undefined;

  const regex = new RegExp(escapeRegex(term), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) } as QueryFilter<T>;
};

/**
 * Reusable query builder shared by every collection.
 *
 * ```ts
 * const { data, pagination } = await new ApiFeatures(Category, req.query)
 *   .searchable(['name', 'slug'])
 *   .sortable(['name', 'createdAt'])
 *   .selectable(['name', 'slug'])
 *   .exec();
 * ```
 */
export class ApiFeatures<T> {
  private readonly model: Model<T>;
  private readonly query: ApiQuery;
  private readonly baseFilter: QueryFilter<T>;
  private searchFields: string[] = [];
  private sortFields: string[] = [];
  private selectFields: string[] = [];

  constructor(model: Model<T>, query: ApiQuery = {}, baseFilter: QueryFilter<T> = {}) {
    this.model = model;
    this.query = query;
    this.baseFilter = baseFilter;
  }

  searchable(fields: string[]): this {
    this.searchFields = fields;
    return this;
  }

  sortable(fields: string[]): this {
    this.sortFields = fields;
    return this;
  }

  selectable(fields: string[]): this {
    this.selectFields = fields;
    return this;
  }

  private buildFilter(): QueryFilter<T> {
    const searchFilter = buildSearchFilter<T>(this.query.search, this.searchFields);
    if (!searchFilter) return this.baseFilter;
    if (Object.keys(this.baseFilter).length === 0) return searchFilter;
    return { $and: [this.baseFilter, searchFilter] } as QueryFilter<T>;
  }

  async exec(): Promise<ApiResult<T>> {
    const filter = this.buildFilter();
    const { page, limit, skip } = parsePagination(this.query);
    const sort = parseSort(this.query.sort, this.sortFields) ?? { createdAt: -1 };
    const fields = parseFields(this.query.select ?? this.query.fields, this.selectFields);
    const populate = parsePopulate(this.query.populate);

    const totalResults = await this.model.countDocuments(filter);

    let query = this.model.find(filter);
    if (fields) query = query.select(fields);
    query = query.sort(sort).skip(skip).limit(limit);
    if (populate.length > 0) query = query.populate(populate);

    const data = await query.exec();
    const totalPages = Math.ceil(totalResults / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        totalResults,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
