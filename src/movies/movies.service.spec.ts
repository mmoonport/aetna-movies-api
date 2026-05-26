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

// ---------------------------------------------------------------------------
// findOne
// ---------------------------------------------------------------------------
describe('MoviesService.findOne', () => {
  function buildService(movieRow: unknown, avgRating: number | null) {
    const moviesDb = makeMockDb({
      'WHERE movieId': makeStmt(movieRow),
    });
    const ratingsDb = makeMockDb({
      'AVG(rating)': makeStmt({ avg: avgRating }),
    });
    return new MoviesService(
      moviesDb as unknown as import('better-sqlite3').Database,
      ratingsDb as unknown as import('better-sqlite3').Database,
    );
  }

  it('returns full movie detail with parsed fields', () => {
    const result = buildService(MOVIE_ROW, 3.75).findOne(1);

    expect(result.imdbId).toBe('tt0000001');
    expect(result.title).toBe('Test Movie');
    expect(result.description).toBe('A test film.');
    expect(result.runtime).toBe(120);
    expect(result.language).toBe('en');
    expect(result.genres).toEqual([{ id: 28, name: 'Action' }]);
    expect(result.productionCompanies).toEqual([{ id: 1, name: 'Test Studio' }]);
  });

  it('formats budget as a USD currency string', () => {
    const result = buildService(MOVIE_ROW, null).findOne(1);
    expect(result.budget).toBe('$1,000,000');
  });

  it('includes averageRating from the ratings database', () => {
    const result = buildService(MOVIE_ROW, 3.75).findOne(1);
    expect(result.averageRating).toBe(3.75);
  });

  it('returns null averageRating when no ratings exist', () => {
    const result = buildService(MOVIE_ROW, null).findOne(1);
    expect(result.averageRating).toBeNull();
  });

  it('throws NotFoundException when movie does not exist', () => {
    const service = buildService(undefined, null);
    expect(() => service.findOne(999)).toThrow(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// listByYear
// ---------------------------------------------------------------------------
describe('MoviesService.listByYear', () => {
  function buildService(rows: unknown[], count: number) {
    const countStmt = makeStmt({ count });
    const rowsStmt = makeStmt(rows);
    const moviesDb = makeMockDb({
      'COUNT(*)': countStmt,
      'LIMIT': rowsStmt,
    });
    return {
      service: new MoviesService(
        moviesDb as unknown as import('better-sqlite3').Database,
        {} as unknown as import('better-sqlite3').Database,
      ),
      rowsStmt,
    };
  }

  it('returns paginated results for a given year', () => {
    const { service } = buildService([MOVIE_ROW], 1);
    const result = service.listByYear(2000, 1, 'asc');

    expect(result.meta.totalItems).toBe(1);
    expect(result.data[0].title).toBe('Test Movie');
  });

  it('passes year as string to strftime query', () => {
    const countStmt = makeStmt({ count: 0 });
    const rowsStmt = makeStmt([]);
    const moviesDb = makeMockDb({
      'COUNT(*)': countStmt,
      'LIMIT': rowsStmt,
    });
    const svc = new MoviesService(
      moviesDb as unknown as import('better-sqlite3').Database,
      {} as unknown as import('better-sqlite3').Database,
    );
    svc.listByYear(1999, 1, 'asc');
    expect(countStmt.get).toHaveBeenCalledWith('1999');
  });

  it('passes DESC direction for order=desc', () => {
    const countStmt = makeStmt({ count: 0 });
    const rowsStmt = makeStmt([]);
    const moviesDb = {
      prepare: jest.fn((sql: string) => {
        if (sql.includes('COUNT(*)')) return countStmt;
        if (sql.includes('DESC')) return rowsStmt;
        throw new Error(`Unexpected SQL: ${sql}`);
      }),
    };
    const svc = new MoviesService(
      moviesDb as unknown as import('better-sqlite3').Database,
      {} as unknown as import('better-sqlite3').Database,
    );
    expect(() => svc.listByYear(2000, 1, 'desc')).not.toThrow();
  });

  it('returns empty data when no movies match the year', () => {
    const { service } = buildService([], 0);
    const result = service.listByYear(1800, 1, 'asc');

    expect(result.data).toHaveLength(0);
    expect(result.meta.totalItems).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// listByGenre
// ---------------------------------------------------------------------------
describe('MoviesService.listByGenre', () => {
  function buildService(rows: unknown[], count: number) {
    const countStmt = makeStmt({ count });
    const rowsStmt = makeStmt(rows);
    const moviesDb = makeMockDb({
      'COUNT(*)': countStmt,
      'LIMIT': rowsStmt,
    });
    return {
      service: new MoviesService(
        moviesDb as unknown as import('better-sqlite3').Database,
        {} as unknown as import('better-sqlite3').Database,
      ),
      countStmt,
      rowsStmt,
    };
  }

  it('returns paginated results for a given genre ID', () => {
    const { service } = buildService([MOVIE_ROW], 1);
    const result = service.listByGenre(28, 1);

    expect(result.meta.totalItems).toBe(1);
    expect(result.data[0].title).toBe('Test Movie');
  });

  it('passes the genre ID to both count and rows queries', () => {
    const { service, countStmt, rowsStmt } = buildService([MOVIE_ROW], 1);
    service.listByGenre(18, 1);

    expect(countStmt.get).toHaveBeenCalledWith(18);
    expect(rowsStmt.all).toHaveBeenCalledWith(18, 50, 0);
  });

  it('returns empty data when no movies match the genre ID', () => {
    const { service } = buildService([], 0);
    const result = service.listByGenre(9999, 1);

    expect(result.data).toHaveLength(0);
    expect(result.meta.totalItems).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });

  it('calculates correct offset for page 2', () => {
    const { service, rowsStmt } = buildService([], 100);
    service.listByGenre(28, 2);

    expect(rowsStmt.all).toHaveBeenCalledWith(28, 50, 50);
  });
});
