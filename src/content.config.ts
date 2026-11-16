import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number(),
    minutes: z.number(),
    level: z.enum(['Foundation', 'Intermediate', 'Advanced']),
    standards: z.array(z.string()).default([]),
    outcomes: z.array(z.string()).default([]),
  }),
});

export const collections = { lessons };
