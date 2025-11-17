// src/data/accounts.js

export const accounts = [
  {
    id: 'user-1',
    username: 'partylover',
    email: 'user1@example.com',
    password: 'password1',
    role: 'user',
    isVerified: true,
    preferences: ['music', 'party'],
    venueDetails: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'venue-1',
    username: 'club-vibes',
    email: 'venue@example.com',
    password: 'venuepass',
    role: 'venue',
    isVerified: true,
    preferences: [],
    venueDetails: {
      location: 'Athens Center',
      taxIdentificationNumHashed: 123456,
      businessRegistrationNumHashed: 987654
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
