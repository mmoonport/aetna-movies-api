import { DocumentBuilder } from '@nestjs/swagger';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Movies API')
    .setDescription('Aetna take-home — movie data backed by SQLite')
    .setVersion('1.0')
    .build();
}
