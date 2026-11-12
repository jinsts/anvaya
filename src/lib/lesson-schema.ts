import { z } from 'astro/zod';
import { slug } from './content-schemas';

const interviewQuestion = z.object({
  prompt: z.string().min(10),
  answer: z.string().min(20),
  followUps: z.array(z.string().min(5)).default([]),
});

export const lessonSchema = z
  .object({
    title: z.string().min(3),
    // Navigation label; defaults to the title.
    shortTitle: z.string().min(2).max(40).optional(),
    summary: z.string().min(15),
    subject: slug,
    // Optional default study context. Membership and ordering belong to paths.
    path: slug.optional(),
    difficulty: z.enum(['foundation', 'intermediate', 'advanced']),
    estimatedMinutes: z.number().int().positive(),
    learningObjectives: z.array(z.string().min(5)).min(1),
    prerequisites: z.array(z.string()).default([]),
    tags: z.array(slug).default([]),
    // Cross-cutting skill IDs from src/content/skills/ that the lesson practises.
    skills: z.array(slug).default([]),
    status: z.enum(['draft', 'reviewed', 'published']).default('draft'),
    // Who wrote the current draft. Only the owner promotes status.
    drafter: z.enum(['agent', 'owner']),
    reviewedAt: z.coerce.date().optional(),
    interviewQuestions: z.array(interviewQuestion).default([]),
    sources: z
      .array(z.object({ label: z.string().min(3), url: z.url() }))
      .min(1),
  })
  .superRefine((lesson, context) => {
    if (lesson.status !== 'draft' && !lesson.reviewedAt) {
      context.addIssue({
        code: 'custom',
        message: 'Reviewed/published lessons require reviewedAt.',
      });
    }
    if (
      lesson.sources.some((source) =>
        /example\.(org|com)|replace-before/i.test(source.url),
      )
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Replace placeholder sources.',
      });
    }
  });
