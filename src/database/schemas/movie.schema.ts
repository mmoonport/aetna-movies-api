import { z } from 'zod';

export const GenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const ProductionCompanySchema = z.object({
  id: z.number(),
  name: z.string(),
});

/** Raw row as returned by better-sqlite3 */
export const MovieRowSchema = z.object({
  movieId: z.number(),
  imdbId: z.string(),
  title: z.string(),
  overview: z.string().nullable(),
  productionCompanies: z.string().nullable(),
  releaseDate: z.string().nullable(),
  budget: z.number(),
  revenue: z.number(),
  runtime: z.number().nullable(),
  language: z.string().nullable(),
  genres: z.string().nullable(),
  status: z.string().nullable(),
});

/** Subset returned by list queries (not all columns are selected) */
export const MovieListRowSchema = MovieRowSchema.pick({
  movieId: true,
  imdbId: true,
  title: true,
  genres: true,
  releaseDate: true,
  budget: true,
});

export const MovieCountSchema = z.object({ count: z.number() });

export type MovieRow = z.infer<typeof MovieRowSchema>;
export type Genre = z.infer<typeof GenreSchema>;
export type ProductionCompany = z.infer<typeof ProductionCompanySchema>;
export type MovieCount = z.infer<typeof MovieCountSchema>;
