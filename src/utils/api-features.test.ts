import { buildSearchFilter, escapeRegex, parseFields, parsePagination, parsePopulate, parseSort } from './api-features.js';

describe('ApiFeatures helpers', () => {
  describe('parsePagination', () => {
    it('defaults to the first page with a limit of 10', () => {
      expect(parsePagination({})).toEqual({ page: 1, limit: 10, skip: 0 });
    });

    it('computes skip from page and limit', () => {
      expect(parsePagination({ page: '3', limit: '20' })).toEqual({ page: 3, limit: 20, skip: 40 });
    });

    it('caps the limit at 100', () => {
      expect(parsePagination({ limit: '500' })).toEqual({ page: 1, limit: 100, skip: 0 });
    });

    it('ignores invalid values', () => {
      expect(parsePagination({ page: '-1', limit: 'abc' })).toEqual({ page: 1, limit: 10, skip: 0 });
    });
  });

  describe('parseSort', () => {
    it('maps fields to directions', () => {
      expect(parseSort('name,-createdAt', ['name', 'createdAt'])).toEqual({ name: 1, createdAt: -1 });
    });

    it('drops fields outside the allowlist', () => {
      expect(parseSort('name,price', ['name'])).toEqual({ name: 1 });
    });

    it('returns undefined when nothing valid remains', () => {
      expect(parseSort('price', ['name'])).toBeUndefined();
      expect(parseSort(undefined, ['name'])).toBeUndefined();
    });
  });

  describe('parseFields', () => {
    it('builds a projection string', () => {
      expect(parseFields('name,slug,-description')).toBe('name slug -description');
    });

    it('drops invalid field tokens', () => {
      expect(parseFields('name,$where')).toBe('name');
    });

    it('keeps only allowlisted fields, including excluded ones', () => {
      expect(parseFields('name,slug,-description', ['name', 'slug'])).toBe('name slug');
      expect(parseFields('name,password', ['name'])).toBe('name');
    });

    it('returns undefined when empty', () => {
      expect(parseFields(undefined)).toBeUndefined();
      expect(parseFields('')).toBeUndefined();
    });
  });

  describe('parsePopulate', () => {
    it('splits comma separated paths', () => {
      expect(parsePopulate('category,owner')).toEqual(['category', 'owner']);
    });

    it('returns an empty list when absent', () => {
      expect(parsePopulate(undefined)).toEqual([]);
    });
  });

  describe('escapeRegex', () => {
    it('escapes regex special characters', () => {
      expect(escapeRegex('a.b*c')).toBe('a\\.b\\*c');
    });
  });

  describe('buildSearchFilter', () => {
    it('builds a case-insensitive or filter', () => {
      expect(buildSearchFilter('phone', ['name', 'description'])).toEqual({
        $or: [{ name: /phone/i }, { description: /phone/i }],
      });
    });

    it('returns undefined without a search term', () => {
      expect(buildSearchFilter(undefined, ['name'])).toBeUndefined();
      expect(buildSearchFilter('   ', ['name'])).toBeUndefined();
    });
  });
});
