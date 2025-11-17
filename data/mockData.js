import { randomUUID } from 'crypto';
import { USER_ROLES, VERIFICATION_STATUS, EVENT_STATUS, NOTIFICATION_TYPES } from '../config/constants.js';

const now = new Date();

const accounts = [
  {
    id: 'acct-001',
    username: 'partylover',
    email: 'partylover@example.com',
    role: USER_ROLES.USER,
    status: 'active',
    followers: [],
    following: ['acct-002'],
    preferences: {
      categories: ['music', 'nightlife'],
      locations: ['Berlin'],
      priceRange: { min: 0, max: 80 },
      notificationOptIn: true
    },
    verification: {
      status: VERIFICATION_STATUS.PENDING
    }
  },
  {
    id: 'acct-002',
    username: 'vibesvenue',
    email: 'hello@vibesvenue.com',
    role: USER_ROLES.VENUE,
    status: 'active',
  followers: ['acct-001'],
  following: [],
    preferences: {
      categories: ['music', 'pop'],
      locations: ['Berlin'],
      priceRange: { min: 20, max: 120 },
      notificationOptIn: true
    },
    verification: {
      status: VERIFICATION_STATUS.APPROVED
    }
  },
  {
    id: 'acct-003',
    username: 'superadmin',
    email: 'admin@onlyvibes.com',
    role: USER_ROLES.ADMIN,
    status: 'active',
  followers: [],
  following: [],
    preferences: {},
    verification: {
      status: VERIFICATION_STATUS.APPROVED
    }
  }
];

const events = [
  {
    id: 'evt-001',
    title: 'Midnight Techno Bash',
    description: 'Underground techno night with top DJs.',
    category: 'music',
    dateTime: new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString(),
    location: {
      name: 'Club Matrix',
      address: '123 Rave St',
      city: 'Berlin',
      country: 'Germany'
    },
    ownerId: 'acct-002',
    imageUrl: 'https://picsum.photos/seed/techno/400/200',
    availableSeats: 120,
    status: EVENT_STATUS.ACTIVE,
    likes: 42
  },
  {
    id: 'evt-002',
    title: 'Sunset Rooftop Vibes',
    description: 'Chill house music and cocktails.',
    category: 'nightlife',
    dateTime: new Date(now.getTime() + 1000 * 60 * 60 * 48).toISOString(),
    location: {
      name: 'Skyline Loft',
      address: '456 Sunset Blvd',
      city: 'Barcelona',
      country: 'Spain'
    },
    ownerId: 'acct-002',
    imageUrl: 'https://picsum.photos/seed/rooftop/400/200',
    availableSeats: 80,
    status: EVENT_STATUS.ACTIVE,
    likes: 10
  }
];

const reviews = [
  {
    id: 'rev-001',
    eventId: 'evt-001',
    userId: 'acct-001',
    rating: 5,
    comment: 'Amazing vibes all night!'
  }
];

const verificationRequests = [
  {
    id: 'ver-001',
    userId: 'acct-001',
    role: USER_ROLES.VERIFIED_USER,
    idType: 'passport',
    idNumber: 'X1234567',
    email: 'partylover@example.com',
    phoneNumber: '+491234567',
    status: VERIFICATION_STATUS.PENDING
  }
];

const notifications = [
  {
    id: 'not-001',
    userId: 'acct-001',
    message: 'Midnight Techno Bash starts in 24 hours!',
    type: NOTIFICATION_TYPES.REMINDER,
    isRead: false
  }
];

const reminders = [
  {
    id: 'rem-001',
    userId: 'acct-001',
    eventId: 'evt-001',
    remindAt: new Date(now.getTime() + 1000 * 60 * 60 * 20).toISOString(),
    type: 'push',
    isSent: false
  }
];

const filters = [
  {
    filterId: 'genre-techno',
    type: 'category',
    value: 'Techno'
  },
  {
    filterId: 'price-free',
    type: 'price',
    value: 'Free'
  }
];

export const mockDb = {
  accounts,
  events,
  reviews,
  verificationRequests,
  notifications,
  reminders,
  filters
};

export const addMockItem = (collection, item) => {
  const entity = { id: randomUUID(), ...item };
  mockDb[collection].push(entity);
  return entity;
};

export const updateMockItem = (collection, id, updates) => {
  const index = mockDb[collection].findIndex((item) => item.id === id);
  if (index === -1) return null;
  mockDb[collection][index] = { ...mockDb[collection][index], ...updates };
  return mockDb[collection][index];
};

export const deleteMockItem = (collection, id) => {
  const index = mockDb[collection].findIndex((item) => item.id === id);
  if (index === -1) return false;
  mockDb[collection].splice(index, 1);
  return true;
};
