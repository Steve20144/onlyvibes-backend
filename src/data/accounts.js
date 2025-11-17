const accounts = [
  {
    userId: 'user-1',
    username: 'verifiedUser',
    email: 'verified@example.com',
    password: 'password123',
    role: 'verified-user',
    preferences: {
      categories: ['music', 'techno'],
      locations: ['Berlin'],
      priceRange: 'mid'
    },
    verificationStatus: 'verified',
    createdAt: '2024-01-05T10:00:00.000Z',
    updatedAt: '2024-01-05T10:00:00.000Z',
    status: 'active'
  },
  {
    userId: 'user-2',
    username: 'standardUser',
    email: 'standard@example.com',
    password: 'password123',
    role: 'user',
    preferences: {
      categories: ['jazz', 'art'],
      locations: ['Paris'],
      priceRange: 'low'
    },
    verificationStatus: 'unverified',
    createdAt: '2024-02-10T09:30:00.000Z',
    updatedAt: '2024-02-10T09:30:00.000Z',
    status: 'active'
  },
  {
    userId: 'user-3',
    username: 'venueOwner',
    email: 'venue@example.com',
    password: 'password123',
    role: 'venue',
    preferences: {
      categories: ['house'],
      locations: ['Barcelona']
    },
    verificationStatus: 'pending',
    venueDetails: {
      name: 'Sunset Terrace',
      address: 'Passeig de Gracia 1',
      capacity: 400
    },
    createdAt: '2024-03-14T08:00:00.000Z',
    updatedAt: '2024-03-14T08:00:00.000Z',
    status: 'active'
  }
];

let nextAccountId = accounts.length + 1;

const clone = (value) => JSON.parse(JSON.stringify(value));

const listAccounts = () => accounts.map(clone);

const findAccountById = (userId) => accounts.find((account) => account.userId === userId);

const findAccountByEmail = (email) => accounts.find((account) => account.email.toLowerCase() === email.toLowerCase());

const createAccountRecord = (payload) => {
  const timestamp = new Date().toISOString();
  const account = {
    userId: `user-${nextAccountId++}`,
    username: payload.username,
    email: payload.email,
    password: payload.password,
    role: payload.role || 'user',
    preferences: payload.preferences || {},
    verificationStatus: payload.role === 'venue' ? 'pending' : 'unverified',
    venueDetails: payload.venueDetails || null,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'active'
  };

  accounts.push(account);
  return clone(account);
};

const updateAccountRecord = (userId, updates) => {
  const account = findAccountById(userId);
  if (!account) {
    return null;
  }

  Object.assign(account, updates, { updatedAt: new Date().toISOString() });
  return clone(account);
};

const deleteAccountRecord = (userId) => {
  const index = accounts.findIndex((account) => account.userId === userId);
  if (index === -1) {
    return false;
  }

  accounts.splice(index, 1);
  return true;
};

module.exports = {
  listAccounts,
  findAccountById,
  findAccountByEmail,
  createAccountRecord,
  updateAccountRecord,
  deleteAccountRecord
};
