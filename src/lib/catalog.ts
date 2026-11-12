import { getCollection, type CollectionEntry } from 'astro:content';
import {
  lessonUrl,
  pathLessonIds,
  pathSubjects,
  validateCatalog,
  type Category,
  type LearningPath,
  type Problem,
  type Skill,
  type Source,
} from './path-model';

export type Lesson = CollectionEntry<'lessons'>;
// The schema's output type is assignable to `Subject`, and keeps required fields required.
export type CatalogSubject = CollectionEntry<'subjects'>['data'] & {
  id: string;
};

export const lessonLabel = (lesson: Lesson) =>
  lesson.data.shortTitle ?? lesson.data.title;

/** Lesson URL that keeps a non-default path as `?path=` context. */
export const lessonUrlIn = (lesson: Lesson, pathId?: string) =>
  lessonUrl(lesson.id, lesson.data.path === pathId ? undefined : pathId);

async function loadCatalog() {
  const [
    lessonEntries,
    categoryEntries,
    subjectEntries,
    pathEntries,
    sourceEntries,
    problemEntries,
    skillEntries,
  ] = await Promise.all([
    getCollection('lessons'),
    getCollection('categories'),
    getCollection('subjects'),
    getCollection('paths'),
    getCollection('sources'),
    getCollection('problems'),
    getCollection('skills'),
  ]);
  const categories: Category[] = categoryEntries.map(({ id, data }) => ({
    id,
    ...data,
  }));
  const subjects: CatalogSubject[] = subjectEntries.map(({ id, data }) => ({
    id,
    ...data,
  }));
  const paths = pathEntries
    .map(({ id, data }) => {
      const { lessons, planned, sections, ...details } = data;
      // The schema guarantees exactly one of lessons/sections.
      return (
        sections
          ? { id, ...details, sections }
          : { id, ...details, lessons: lessons ?? [], planned }
      ) as LearningPath & { order: number };
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const sources: Source[] = sourceEntries.map(({ id, data }) => ({
    id,
    ...data,
  }));
  const problems: Problem[] = problemEntries
    .map(({ id, data }) => ({ id, ...data }))
    .sort((a, b) => a.title.localeCompare(b.title));
  const skills: Skill[] = skillEntries
    .map(({ id, data }) => ({ id, ...data }))
    .sort((a, b) => a.title.localeCompare(b.title));
  validateCatalog({
    lessons: lessonEntries,
    paths,
    subjects,
    categories,
    skills,
    sources,
    problems,
  });

  // Study order: lessons as they appear in paths, then standalone lessons by title.
  const pathOrder = [...new Set(paths.flatMap(pathLessonIds))];
  const rank = new Map(pathOrder.map((id, index) => [id, index]));
  const lessons = [...lessonEntries].sort(
    (a, b) =>
      (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) ||
      a.data.title.localeCompare(b.data.title),
  );
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const pathsByLesson = new Map<string, LearningPath[]>();
  for (const path of paths) {
    for (const id of pathLessonIds(path))
      pathsByLesson.set(id, [...(pathsByLesson.get(id) ?? []), path]);
  }
  const problemsByLesson = new Map<string, Problem[]>();
  for (const problem of problems) {
    for (const id of problem.lessons)
      problemsByLesson.set(id, [...(problemsByLesson.get(id) ?? []), problem]);
  }
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  // Shown once there is something to study or an approved plan (ADR 0007).
  const availableSubjects = subjects.filter(
    (subject) =>
      subject.overview ||
      lessons.some((lesson) => lesson.data.subject === subject.id) ||
      paths.some((path) => pathSubjects(path).includes(subject.id)),
  );
  return {
    lessons,
    lessonById,
    paths,
    pathsByLesson,
    categories,
    subjects,
    subjectById,
    availableSubjects,
    skills,
    skillById: new Map(skills.map((skill) => [skill.id, skill])),
    sources,
    problems,
    problemsByLesson,
  };
}

export type Catalog = Awaited<ReturnType<typeof loadCatalog>>;

let cached: Promise<Catalog> | undefined;

/** Load and validate content once per build. Development reloads on every request. */
export function getCatalog(): Promise<Catalog> {
  if (import.meta.env.DEV) return loadCatalog();
  return (cached ??= loadCatalog());
}
