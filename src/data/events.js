const events = [
  {
    eventId: 'event-1',
    title: 'Sunset Vibes',
    description: 'House music on the beach',
    location: 'Barcelona',
    venue: 'Sunset Terrace',
    date: '2025-06-20T19:00:00.000Z',
    category: 'music',
    price: 25,
    capacity: 400,
    organizerId: 'user-1',
    createdAt: '2024-11-01T09:00:00.000Z',
    updatedAt: '2024-11-01T09:00:00.000Z'
  },
  {
    eventId: 'event-2',
    title: 'Jazz & Cocktails',
    description: 'Intimate jazz evening',
    location: 'Paris',
    venue: 'Le Bleu',
    date: '2025-05-14T20:00:00.000Z',
    category: 'music',
    price: 40,
    capacity: 120,
    organizerId: 'user-3',
    createdAt: '2024-10-15T09:00:00.000Z',
    updatedAt: '2024-10-15T09:00:00.000Z'
  }
];

let nextEventId = events.length + 1;

const clone = (value) => JSON.parse(JSON.stringify(value));

const listEvents = (filters = {}) => {
  const { category, location, fromDate, toDate, sort } = filters;

  let result = [...events];

  if (category) {
    result = result.filter((event) => event.category === category);
  }

  if (location) {
    result = result.filter((event) => event.location === location);
  }

  if (fromDate) {
    result = result.filter((event) => new Date(event.date) >= new Date(fromDate));
  }

  if (toDate) {
    result = result.filter((event) => new Date(event.date) <= new Date(toDate));
  }

  if (sort === 'date') {
    result.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  if (sort === '-date') {
    result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return result.map(clone);
};

const findEventById = (eventId) => events.find((event) => event.eventId === eventId);

const createEventRecord = (payload) => {
  const timestamp = new Date().toISOString();
  const event = {
    eventId: `event-${nextEventId++}`,
    title: payload.title,
    description: payload.description || '',
    location: payload.location,
    venue: payload.venue || null,
    date: payload.date,
    category: payload.category || 'music',
    price: payload.price ?? null,
    capacity: payload.capacity ?? null,
    organizerId: payload.organizerId,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  events.push(event);
  return clone(event);
};

const updateEventRecord = (eventId, updates) => {
  const event = findEventById(eventId);
  if (!event) {
    return null;
  }

  Object.assign(event, updates, { updatedAt: new Date().toISOString() });
  return clone(event);
};

const deleteEventRecord = (eventId) => {
  const index = events.findIndex((event) => event.eventId === eventId);
  if (index === -1) {
    return false;
  }

  events.splice(index, 1);
  return true;
};

module.exports = {
  listEvents,
  findEventById,
  createEventRecord,
  updateEventRecord,
  deleteEventRecord
};
