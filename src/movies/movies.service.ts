import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import Database from 'better-sqlite3';
import { MOVIES_DB, RATINGS_DB } from '../database/database.providers.js';
import {
  GenreSchema,
  ProductionCompanySchema,
  MovieRowSchema,
  MovieListRowSchema,
} from '../database/schemas/movie.schema.js';
import type { Genre, MovieCount, MovieRow, ProductionCompany } from '../database/schemas/movie.schema.js';
import { intToCurrencyString } from '../utils/numbers.js';
import { AverageRatingSchema } from '../database/schemas/rating.schema.js';
import type { AverageRating } from '../database/schemas/rating.schema.js';

export type { Genre, ProductionCompany };

const PAGE_SIZE = 50;

export interface MovieListItem {
  movieId: number;
  imdbId: string;
  title: string;
  genres: Genre[];
  releaseDate: string | null;
  budget: string;
}

export interface MovieDetail extends MovieListItem {
  description: string | null;
  runtime: number | null;
  language: string | null;
  productionCompanies: ProductionCompany[];
  averageRating: number | null;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
}

function parseJsonArray<T>(
  value: string | null | undefined,
  itemParser: (item: unknown) => T,
): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown[];
    return Array.isArray(parsed) ? parsed.map(itemParser) : [];
  } catch {
    return [];
  }
}

function toListItem(raw: Record<string, unknown>): MovieListItem {
  const row = MovieListRowSchema.parse(raw);
  return {
    movieId: row.movieId,
    imdbId: row.imdbId,
    title: row.title,
    genres: parseJsonArray(row.genres, (v) => GenreSchema.parse(v)),
    releaseDate: row.releaseDate,
    budget: intToCurrencyString(row.budget),
  };
}

@Injectable()
export class MoviesService {
  constructor(
    @Inject(MOVIES_DB) private readonly moviesDb: Database.Database,
    @Inject(RATINGS_DB) private readonly ratingsDb: Database.Database,
  ) {}

  listAll(page: number): PaginatedResult<MovieListItem> {
    const offset = (page - 1) * PAGE_SIZE;

    const { count: totalItems } = this.moviesDb
      .prepare('SELECT COUNT(*) as count FROM movies')
      .get() as { count: number };

    const rows = this.moviesDb
      .prepare(
        `SELECT movieId, imdbId, title, genres, releaseDate, budget
         FROM movies
         LIMIT ? OFFSET ?`,
      )
      .all(PAGE_SIZE, offset) as MovieRow[];

    return {
      data: rows.map(toListItem),
      meta: {
        page,
        perPage: PAGE_SIZE,
        totalItems,
        totalPages: Math.ceil(totalItems / PAGE_SIZE),
      },
    };
  }

  findOne(movieId: number): MovieDetail {
    const raw = this.moviesDb
      .prepare(
        `SELECT movieId, imdbId, title, overview, productionCompanies,
                releaseDate, budget, revenue, runtime, language, genres, status
         FROM movies
         WHERE movieId = ?`,
      )
      .get(movieId) as MovieRow | undefined;

    if (!raw) {
      throw new NotFoundException(`Movie with id ${movieId} not found`);
    }

    const row = MovieRowSchema.parse(raw);

    const { avg: averageRating } = AverageRatingSchema.parse(
      this.ratingsDb
        .prepare('SELECT AVG(rating) as avg FROM ratings WHERE movieId = ?')
        .get(movieId),
    );

    return {
      movieId: row.movieId,
      imdbId: row.imdbId,
      title: row.title,
      description: row.overview,
      genres: parseJsonArray(row.genres, (v) => GenreSchema.parse(v)),
      releaseDate: row.releaseDate,
      budget: intToCurrencyString(row.budget),
      runtime: row.runtime,
      language: row.language,
      productionCompanies: parseJsonArray(row.productionCompanies, (v) =>
        ProductionCompanySchema.parse(v),
      ),
      averageRating,
    };
  }

  listByYear(
    year: number,
    page: number,
    order: 'asc' | 'desc',
  ): PaginatedResult<MovieListItem> {
    const offset = (page - 1) * PAGE_SIZE;
    const direction = order === 'desc' ? 'DESC' : 'ASC';

    const { count: totalItems } = this.moviesDb
      .prepare(
        `SELECT COUNT(*) as count FROM movies
         WHERE strftime('%Y', releaseDate) = ?`,
      )
      .get(String(year)) as  MovieCount;

    const rows = this.moviesDb
      .prepare(
        `SELECT movieId, imdbId, title, genres, releaseDate, budget
         FROM movies
         WHERE strftime('%Y', releaseDate) = ?
         ORDER BY releaseDate ${direction}
         LIMIT ? OFFSET ?`,
      )
      .all(String(year), PAGE_SIZE, offset) as MovieRow[];

    return {
      data: rows.map(toListItem),
      meta: {
        page,
        perPage: PAGE_SIZE,
        totalItems,
        totalPages: Math.ceil(totalItems / PAGE_SIZE),
      },
    };
  }

  listByGenre(genreId: number, page: number): PaginatedResult<MovieListItem> {
    const offset = (page - 1) * PAGE_SIZE;

    const { count: totalItems } = this.moviesDb
      .prepare(
        `SELECT COUNT(*) as count FROM movies
         WHERE EXISTS (
           SELECT 1 FROM json_each(genres)
           WHERE json_extract(value, '$.id') = ?
         )`,
      )
      .get(genreId) as MovieCount;

    const rows = this.moviesDb
      .prepare(
        `SELECT movieId, imdbId, title, genres, releaseDate, budget
         FROM movies
         WHERE EXISTS (
           SELECT 1 FROM json_each(genres)
           WHERE json_extract(value, '$.id') = ?
         )
         LIMIT ? OFFSET ?`,
      )
      .all(genreId, PAGE_SIZE, offset) as MovieRow[];

    return {
      data: rows.map(toListItem),
      meta: {
        page,
        perPage: PAGE_SIZE,
        totalItems,
        totalPages: Math.ceil(totalItems / PAGE_SIZE),
      },
    };
  }
}
