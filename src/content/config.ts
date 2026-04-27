import { defineCollection, z } from 'astro:content';

const schools = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    location: z.string(),
    description: z.string(),
    image: z.string().optional(),
    lecturers: z.array(
      z.object({
        name: z.string(),
        affiliation: z.string().optional(),
        url: z.string().url().optional(),
      })
    ),
    topics: z.array(z.string()),
    attendees: z.number().int().positive().optional(),
    applicationUrl: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const videos = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
  }),
});

const consulting = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { schools, videos, consulting };
