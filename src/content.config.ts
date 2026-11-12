import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { lessonSchema } from './lib/lesson-schema';
import {
  categorySchema,
  pathSchema,
  problemSchema,
  skillSchema,
  sourceSchema,
  subjectSchema,
} from './lib/content-schemas';

// One YAML file per entity keeps agent changes small and conflict-free.
const yaml = (folder: string) =>
  glob({ base: `./src/content/${folder}`, pattern: '**/*.yaml' });

export const collections = {
  lessons: defineCollection({
    loader: glob({ base: './src/content/lessons', pattern: '**/*.mdx' }),
    schema: lessonSchema,
  }),
  categories: defineCollection({
    loader: yaml('categories'),
    schema: categorySchema,
  }),
  subjects: defineCollection({
    loader: yaml('subjects'),
    schema: subjectSchema,
  }),
  paths: defineCollection({ loader: yaml('paths'), schema: pathSchema }),
  skills: defineCollection({ loader: yaml('skills'), schema: skillSchema }),
  sources: defineCollection({ loader: yaml('sources'), schema: sourceSchema }),
  problems: defineCollection({
    loader: yaml('problems'),
    schema: problemSchema,
  }),
};
