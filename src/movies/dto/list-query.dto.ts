import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

export class ListQueryDto extends createZodDto(ListQuerySchema) {}
