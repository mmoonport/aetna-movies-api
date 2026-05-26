import Database from 'better-sqlite3';
import { ConfigService } from '@nestjs/config';

export const MOVIES_DB = 'MOVIES_DB';
export const RATINGS_DB = 'RATINGS_DB';

export const databaseProviders = [
  {
    provide: MOVIES_DB,
    inject: [ConfigService],
    useFactory: (config: ConfigService): Database.Database => {
      return new Database(config.get<string>('moviesDb')!, { readonly: true });
    },
  },
  {
    provide: RATINGS_DB,
    inject: [ConfigService],
    useFactory: (config: ConfigService): Database.Database => {
      return new Database(config.get<string>('ratingsDb')!, { readonly: true });
    },
  },
];
