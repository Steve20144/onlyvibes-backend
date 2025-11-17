import { isDatabaseConnected } from '../config/database.js';
import { EventModel } from '../models/Event.js';
import { AccountModel } from '../models/Account.js';
import { mockDb } from '../data/mockData.js';
import { filterBySearchTerm, paginate } from '../utils/helpers.js';

const useDatabase = () => isDatabaseConnected();

/**
 * Performs a basic full-text like search across resources.
 * @param {object} params
 */
export const searchResources = async ({ term = '', resource = 'events', page, pageSize } = {}) => {
  const safeResource = ['events', 'users', 'venues'].includes(resource) ? resource : 'events';

  if (useDatabase()) {
    const query = term ? { $text: { $search: term } } : {};
    const model = safeResource === 'events' ? EventModel : AccountModel;
    const docs = await model.find(query).lean();
    return paginate(docs, { page, pageSize });
  }

  let collection;
  if (safeResource === 'events') {
    collection = mockDb.events;
  } else {
    collection = mockDb.accounts.filter((account) =>
      safeResource === 'venues' ? account.role === 'venue' : account.role !== 'venue'
    );
  }

  const filtered = filterBySearchTerm(collection, term);
  return paginate(filtered, { page, pageSize });
};
