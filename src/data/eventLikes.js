// src/data/eventLikes.js

export const eventLikes = [
  {
    userId: 'user-1',
    eventId: 1,
    likedAt: new Date(Date.now() - 1000)
  },
  {
    userId: 'user-1',
    eventId: 2,
    likedAt: new Date(Date.now() - 500)
  },
  {
    userId: 'user-2',
    eventId: 2,
    likedAt: new Date(Date.now() - 200)
  }
];

/**
 * Remove all likes and optionally seed new ones.
 * @param {Array<{userId:string,eventId:number,likedAt:Date}>} seed
 */
export const resetEventLikes = (seed = []) => {
  eventLikes.length = 0;
  if (seed.length > 0) {
    eventLikes.push(
      ...seed.map((like) => ({
        ...like,
        likedAt: like.likedAt ? new Date(like.likedAt) : new Date()
      }))
    );
  }
};
