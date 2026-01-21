import { z } from 'zod';

export const columnsSchema = z.object({
  headers: z.array(z.string())
});

export const extractedDataSchema = z.object({
  data: z.array(z.record(z.string(), z.string()))
});
