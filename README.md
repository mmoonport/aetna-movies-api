# Movies API

A RESTful API built with [NestJS](https://nestjs.com/) + [Fastify](https://fastify.dev/) backed by two SQLite databases — `movies.db` and `ratings.db`.

---

## Prerequisites

- **Node.js** 22+
- **Java** 17+ (only required for `npm run generate:client`)
- **Docker** (optional, for containerised deployment)

---

## Setup

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
```

The defaults in `.env` point to `./db/movies.db` and `./db/ratings.db` which are already included in the repo.

---

## Running the app

```bash
# Development (watch mode)
npm run start:dev

# Production build + start
npm run build
npm run start:prod
```

The server starts on `http://localhost:3000` (configurable via `PORT` in `.env`).

Interactive Swagger docs are available at **`http://localhost:3000/api`**.

---

## Docker

```bash
# Build the image
docker build -t movies-api .

# Run the container
docker run -p 3000:3000 movies-api
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/movies` | List all movies (paginated) |
| `GET` | `/movies/:id` | Movie detail including average rating |
| `GET` | `/movies/year/:year` | Movies by release year |
| `GET` | `/movies/genre/:genreId` | Movies by genre ID |

### Common query parameters

| Parameter | Endpoints | Description |
|-----------|-----------|-------------|
| `page` | all list endpoints | Page number (default: `1`, 50 results per page) |
| `order` | `/movies/year/:year` | Sort order — `asc` (default) or `desc` |

### Example requests

```bash
# Page 2 of all movies
curl "http://localhost:3000/movies?page=2"

# Details for movie ID 2
curl "http://localhost:3000/movies/2"

# 1994 releases, newest first
curl "http://localhost:3000/movies/year/1994?order=desc"

# Action movies (genre ID 28)
curl "http://localhost:3000/movies/genre/28"
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `MOVIES_DB_PATH` | `./db/movies.db` | Path to the movies SQLite database |
| `RATINGS_DB_PATH` | `./db/ratings.db` | Path to the ratings SQLite database |

---

## Tests

```bash
# Run all unit tests
npm test

# With coverage
npm run test:cov
```

---

## OpenAPI & generated client

```bash
# Write openapi.json to the project root
npm run generate:openapi

# Generate a TypeScript fetch client into ./client (requires Java)
npm run generate:client
```

The generated client uses typed request objects:

```ts
import { MoviesApi, Configuration } from './client';

const api = new MoviesApi(new Configuration({ basePath: 'http://localhost:3000' }));

await api.listAll({ page: 1 });
await api.findOne({ id: 2 });
await api.listByYear({ year: 1994, order: 'desc' });
await api.listByGenre({ genreId: 28 });
```

---

## Project structure

```
src/
├── config/               # Environment configuration
├── database/
│   ├── schemas/          # Zod schemas for DB rows (movies, ratings)
│   └── database.module.ts
├── movies/
│   ├── dto/              # Zod request + response DTOs
│   ├── movies.controller.ts
│   ├── movies.service.ts
│   └── movies.module.ts
├── scripts/
│   └── generate-openapi.ts   # OpenAPI doc generator script
├── utils/
│   └── numbers.ts        # intToCurrencyString helper
├── swagger.config.ts
└── main.ts
db/
├── movies.db
└── ratings.db
```
