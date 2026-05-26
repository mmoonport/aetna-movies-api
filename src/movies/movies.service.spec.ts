import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MoviesService } from './movies.service.js';
import { MOVIES_DB, RATINGS_DB } from '../database/database.providers.js';

// ---------------------------------------------------------------------------
// Helpers to build minimal mock DB statement objects
// ---------------------------------------------------------------------------
function makeStmt(returnValue: unknown) {
  return {
    get: jest.fn().mockReturnValue(returnValue),
    all: jest.fn().mockReturnValue(returnValue),
  };
}

function makeMockDb(stmtMap: Record<string, ReturnType<typeof makeStmt>>) {
  return {
    prepare: jest.fn((sql: string) => {
      for (const [key, stmt] of Object.entries(stmtMap)) {
        if (sql.includes(key)) return stmt;
      }
      throw new Error(`Unexpected SQL in test: ${sql}`);
    }),
  };
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const MOVIE_ROW = {
  movieId: 1,
  imdbId: 'tt0000001',
  title: 'Test Movie',
  overview: 'A test film.',
  productionCompanies: '[{"id":1,"name":"Test Studio"}]',
  releaseDate: '2000-06-15',
  budget: 1000000,
  revenue: 5000000,
  runtime: 120,
  language: 'en',
  genres: '[{"id":28,"name":"Action"}]',
  status: 'Released',
};

// ---------------------------------------------------------------------------
// listAll
// ---------------------------------------------------------------------------
describe('MoviesService.listAll', () => {
  let service: MoviesService;

  beforeEach(async () => {
    const moviesDb = makeMockDb({
      'COUNT(*)': makeStmt({ count: 120 }),
      'LIMIT': makeStmt([MOVIE_ROW, { ...MOVIE_ROW, movieId: 2 }]),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: MOVIES_DB, useValue: moviesDb },
        { provide: RATINGS_DB, useValue: {} },
      ],
    }).compile();

    service = module.get(MoviesService);
  });

  it('returns paginated data with correct meta', () => {
    const result = service.listAll(1);

    expect(result.meta).toEqual({
      page: 1,
      perPage: 50,
      totalItems: 120,
      totalPages: 3,
    });
  });

  it('returns movies with parsed genres', () => {
    const result = service.listAll(1);
    expect(result.data[0].genres).toEqual([{ id: 28, name: 'Action' }]);
  });

  it('returns only list columns (no description / runtime)', () => {
    const result = service.listAll(1);
    const item = result.data[0];
    expect(item).toHaveProperty('imdbId');
    expect(item).toHaveProperty('title');
    expect(item).toHaveProperty('genres');
    expect(item).toHaveProperty('releaseDate');
    expect(item).toHaveProperty('budget');
    expect(item).not.toHaveProperty('description');
    expect(item).not.toHaveProperty('runtime');
  });

  it('formats budget as a USD currency string', () => {
    const result = service.listAll(1);
    expect(result.data[0].budget).toBe('$1,000,000');
  });

  it('calculates correct offset for page 2', () => {
    // Re-wire with a fresh db so we can spy on the LIMIT stmt directly
    const limitStmt = makeStmt([MOVIE_ROW]);
    const moviesDb = makeMockDb({
      'COUNT(*)': makeStmt({ count: 120 }),
      'LIMIT': limitStmt,
    });

    const svc = new MoviesService(
      moviesDb as unknown as import('better-sqlite3').Database,
      {} as unknown as import('better-sqlite3').Database,
    );

    svc.listAll(2);
    expect(limitStmt.all).toHaveBeenCalledWith(50, 50);
  });
});
