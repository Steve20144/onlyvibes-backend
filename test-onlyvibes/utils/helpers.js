import { randomUUID } from 'crypto';
import { DEFAULT_PAGINATION } from '../config/constants.js';

export const generateId = () => randomUUID();

export const paginate = (items = [], { page = DEFAULT_PAGINATION.PAGE, pageSize = DEFAULT_PAGINATION.PAGE_SIZE } = {}) => {
  const safePage = Math.max(parseInt(page, 10) || DEFAULT_PAGINATION.PAGE, 1);
  const safePageSize = Math.max(parseInt(pageSize, 10) || DEFAULT_PAGINATION.PAGE_SIZE, 1);
  const start = (safePage - 1) * safePageSize;
  const pagedItems = items.slice(start, start + safePageSize);

  return {
    results: pagedItems,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalItems: items.length,
      totalPages: Math.ceil(items.length / safePageSize) || 1
    }
  };
};

export const filterBySearchTerm = (items = [], term = '') => {
  if (!term) {
    return items;
  }

  const lowered = term.toLowerCase();
  return items.filter((item) =>
    Object.values(item).some((value) =>
      typeof value === 'string' ? value.toLowerCase().includes(lowered) : false
    )
  );
};

export const sortByField = (items = [], field, direction = 'asc') => {
  if (!field) {
    return items;
  }

  const sorted = [...items].sort((a, b) => {
    if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
    if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};
