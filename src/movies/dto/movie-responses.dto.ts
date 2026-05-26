import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  GenreSchema,
  ProductionCompanySchema,
} from '../../database/schemas/movie.schema.js';

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------
const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  perPage: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const MovieListItemSchema = z.object({
  movieId: z.number().int(),
  imdbId: z.string(),
  title: z.string(),
  genres: z.array(GenreSchema),
  releaseDate: z.string().nullable(),
  budget: z.string().describe('Formatted as USD currency string, e.g. "$1,000,000"'),
});

// ---------------------------------------------------------------------------
// Paginated list  (GET /movies, GET /movies/year/:year, GET /movies/genre/:genre)
// ---------------------------------------------------------------------------
const PaginatedMovieListSchema = z.object({
  data: z.array(MovieListItemSchema),
  meta: PaginationMetaSchema,
});

export class PaginatedMovieListDto extends createZodDto(PaginatedMovieListSchema) {}

// ---------------------------------------------------------------------------
// Movie detail  (GET /movies/:id)
// ---------------------------------------------------------------------------
const MovieDetailSchema = MovieListItemSchema.extend({
  description: z.string().nullable(),
  runtime: z.number().nullable(),
  language: z.string().nullable(),
  productionCompanies: z.array(ProductionCompanySchema),
  averageRating: z.number().nullable().describe('Average rating from the ratings database'),
});

export class MovieDetailDto extends createZodDto(MovieDetailSchema) {}
