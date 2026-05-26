import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../app.module.js';
import { buildSwaggerConfig } from '../swagger.config.js';

async function generate() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: false },
  );

  const document = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, buildSwaggerConfig()),
  );

  const outputPath = join(process.cwd(), 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log(`OpenAPI document written to ${outputPath}`);

  await app.close();
  process.exit(0);
}

generate();
