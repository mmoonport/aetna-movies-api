import { join } from 'path';

export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  moviesDb: process.env.MOVIES_DB_PATH ?? join(process.cwd(), 'db', 'movies.db'),
  ratingsDb: process.env.RATINGS_DB_PATH ?? join(process.cwd(), 'db', 'ratings.db'),
});
