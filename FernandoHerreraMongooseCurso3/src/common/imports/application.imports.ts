import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Port from `.env`, read after Nest has created the app.
 *
 * `ConfigService.get` returns the file value as a string. `Number` turns
 * `"3000"` into `3000`, which is what `app.listen` is called with.
 * A missing `PORT` uses `3000`.
 */
export const port = (app: INestApplication): number => {
  const configService = app.get(ConfigService);
  return Number(configService.get<string>('PORT') ?? 3000);
};