import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const YearQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export class YearQueryDto extends createZodDto(YearQuerySchema) {}
