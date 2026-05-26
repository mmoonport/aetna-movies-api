import { number, z } from 'zod';

/** Raw row as returned by better-sqlite3 */
export const RatingRowSchema = z.object({
  ratingId: z.number(),
  userId: z.number(),
  movieId: z.number(),
  rating: z.number(),
  timestamp: z.number(),
});

export const AverageRatingSchema = z.object({
  avg: z.number().nullable()
})

export type RatingRow = z.infer<typeof RatingRowSchema>;
export type AverageRating = z.infer<typeof AverageRatingSchema>;


