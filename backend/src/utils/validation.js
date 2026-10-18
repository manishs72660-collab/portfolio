const mongoose = require('mongoose');
const AppError = require('./AppError');

function rejectUnknownFields(body, allowedFields) {
  const unknownFields = Object.keys(body).filter((field) => !allowedFields.includes(field));

  if (unknownFields.length) {
    throw new AppError(`Unknown field(s): ${unknownFields.join(', ')}`, 400);
  }
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || (typeof value === 'string' && !value.trim());
  });

  if (missing.length) {
    throw new AppError(`Required field(s): ${missing.join(', ')}`, 400);
  }
}

function parseString(value, field, { required = false, maxLength = 5000 } = {}) {
  if (typeof value !== 'string') {
    throw new AppError(`${field} must be a string`, 400);
  }

  const normalized = value.trim();
  if (!normalized && required) throw new AppError(`${field} is required`, 400);
  if (normalized.length > maxLength) throw new AppError(`${field} must be at most ${maxLength} characters`, 400);
  return normalized;
}

function parseBoolean(value, field) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new AppError(`${field} must be a boolean`, 400);
}

function parseNumber(value, field, { min = -Infinity, max = Infinity } = {}) {
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new AppError(`${field} must be a number`, 400);
  }
  if (typeof value === 'string' && !/^-?\d+(?:\.\d+)?$/.test(value)) {
    throw new AppError(`${field} must be a number`, 400);
  }
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new AppError(`${field} must be a number between ${min} and ${max}`, 400);
  }
  return number;
}

function parseArray(value, field) {
  if (Array.isArray(value)) {
    return value.map((item) => parseString(item, field, { required: true, maxLength: 100 }));
  }

  if (typeof value !== 'string') {
    throw new AppError(`${field} must be an array or comma-separated string`, 400);
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parseArray(parsed, field);
  } catch (error) {
    if (error instanceof AppError) throw error;
  }

  if (!value.trim()) return [];
  return value.split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => parseString(item, field, { required: true, maxLength: 100 }));
}

function parseUrl(value, field) {
  if (typeof value === 'string' && !value.trim()) return '';
  const normalized = parseString(value, field, { maxLength: 2048 });

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('unsupported protocol');
  } catch {
    throw new AppError(`${field} must be a valid HTTP or HTTPS URL`, 400);
  }

  return normalized;
}

function parseDate(value, field, { nullable = false } = {}) {
  if ((value === null || value === '') && nullable) return null;
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value)
  ) {
    throw new AppError(`${field} must be a valid ISO date`, 400);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(`${field} must be a valid ISO date`, 400);
  if (date.toISOString().slice(0, 10) !== value.slice(0, 10)) {
    throw new AppError(`${field} must be a valid ISO date`, 400);
  }
  return date;
}

function parseId(value, field = 'id') {
  if (!/^[a-f\d]{24}$/i.test(value) || !mongoose.isValidObjectId(value)) {
    throw new AppError(`Invalid ${field}`, 400);
  }
  return value;
}

function parseSlug(value, field = 'slug') {
  const slug = parseString(value, field, { required: true, maxLength: 160 }).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new AppError(`${field} may only contain letters, numbers, and single hyphens`, 400);
  }
  return slug;
}

function makeSlug(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)
    .replace(/-+$/g, '');
}

function parsePagination(query, allowedFilters = []) {
  const allowed = new Set(['page', 'limit', ...allowedFilters]);
  const unknown = Object.keys(query).filter((key) => !allowed.has(key));
  if (unknown.length) throw new AppError(`Unknown query parameter(s): ${unknown.join(', ')}`, 400);

  const parseInteger = (value, fallback, field, max) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string') throw new AppError(`${field} must be a positive integer`, 400);
    if (!/^\d+$/.test(value)) throw new AppError(`${field} must be a positive integer`, 400);
    const number = Number(value);
    if (number < 1 || number > max) throw new AppError(`${field} must be between 1 and ${max}`, 400);
    return number;
  };

  const page = parseInteger(query.page, 1, 'page', 1_000_000);
  const limit = parseInteger(query.limit, 10, 'limit', 100);
  return { page, limit, skip: (page - 1) * limit };
}

function parseQueryString(value, field, { maxLength = 200 } = {}) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new AppError(`${field} must be a non-empty string of at most ${maxLength} characters`, 400);
  }
  return value.trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  rejectUnknownFields,
  requireFields,
  parseString,
  parseBoolean,
  parseNumber,
  parseArray,
  parseUrl,
  parseDate,
  parseId,
  parseSlug,
  makeSlug,
  parsePagination,
  parseQueryString,
  escapeRegex,
};
