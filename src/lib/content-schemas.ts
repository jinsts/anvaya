import { z } from 'astro/zod';
import { iconNames } from './icons';

// Schemas for the YAML data collections. One file per entity; the filename is its ID.
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase kebab-case');
export const lessonId = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)+$/,
    'Use a subject/slug lesson ID',
  );

export const tones = [
  'blue',
  'violet',
  'teal',
  'amber',
  'rose',
  'green',
] as const;
export type Tone = (typeof tones)[number];

export const categorySchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  parent: slug.optional(),
});

// A cross-cutting engineering skill, such as debugging, practised in several subjects.
export const skillSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
});

const points = z.array(z.string().min(10)).min(1);
const subjectLink = z.object({ subject: slug, why: z.string().min(10) });

// What a subject covers and why, written before its lessons exist. Its topic
// outline is the `planned` list of the path sections that name the subject.
const overviewSchema = z.object({
  introduction: z.string().min(40),
  whyItMatters: z.string().min(40),
  objectives: points,
  mechanisms: points,
  applications: points,
  experiments: points,
  architecture: points,
  competencies: points,
  interview: points,
  chapters: points,
});

export const priorities = ['low', 'medium', 'high', 'very-high'] as const;

export const subjectSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  category: slug,
  icon: z.enum(iconNames).default('book-open'),
  tone: z.enum(tones).default('blue'),
  priority: z.enum(priorities).optional(),
  // Subjects to study first, and subjects that connect to this one.
  prerequisites: z.array(subjectLink).default([]),
  related: z.array(subjectLink).default([]),
  // How this subject exercises each cross-cutting skill.
  skills: z
    .array(z.object({ skill: slug, focus: z.string().min(10) }))
    .default([]),
  overview: overviewSchema.optional(),
});

// `planned` holds owner-approved topic titles that do not have a lesson yet.
const planned = z.array(z.string().min(3)).default([]);
const sectionSchema = z.object({
  id: slug,
  title: z.string().min(2),
  // A path that spans subjects names the subject of each section.
  subject: slug.optional(),
  lessons: z.array(lessonId).default([]),
  planned,
});

export const pathSchema = z
  .object({
    title: z.string().min(2),
    shortTitle: z.string().min(2).max(40).optional(),
    description: z.string().min(10),
    // Omit for a path whose sections each name a subject.
    subject: slug.optional(),
    audience: z.string().min(10).optional(),
    objectives: z
      .array(
        z.object({ title: z.string().min(3), description: z.string().min(10) }),
      )
      .optional(),
    order: z.number().int().default(100),
    lessons: z.array(lessonId).optional(),
    planned: z.array(z.string().min(3)).optional(),
    sections: z.array(sectionSchema).min(1).optional(),
  })
  .superRefine((path, context) => {
    if ((path.lessons === undefined) === (path.sections === undefined))
      context.addIssue({
        code: 'custom',
        message: 'A path uses either lessons or sections.',
      });
    if (path.sections && path.planned)
      context.addIssue({
        code: 'custom',
        message: 'Put planned topics inside the relevant section.',
      });
    if (!path.subject && !path.sections?.every((section) => section.subject))
      context.addIssue({
        code: 'custom',
        message: 'Name the path subject, or a subject on every section.',
      });
  });

export const sourceKinds = [
  'specification',
  'documentation',
  'book',
  'course',
  'reference',
  'guide',
  'problem-bank',
  'problem-list',
] as const;

export const sourceSchema = z.object({
  name: z.string().min(2),
  kind: z.enum(sourceKinds),
  by: z.string().min(2).optional(),
  url: z.url(),
  // Citations must start with one of these. Defaults to `url`.
  prefixes: z.array(z.url()).min(1).optional(),
  description: z.string().min(10),
});

export const problemSchema = z.object({
  title: z.string().min(2),
  url: z.url(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  lessons: z.array(lessonId).min(1),
  topics: z.array(slug).default([]),
  lists: z.array(slug).default([]),
  hints: z.array(z.string().min(10)).min(1).max(4),
});
