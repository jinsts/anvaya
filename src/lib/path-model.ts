export interface Category {
  id: string;
  title: string;
  description: string;
  parent?: string;
}

export interface SubjectLink {
  subject: string;
  why?: string;
}

export interface Subject {
  id: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  tone?: string;
  prerequisites?: SubjectLink[];
  related?: SubjectLink[];
  skills?: { skill: string; focus?: string }[];
}

export interface Skill {
  id: string;
  title: string;
  description: string;
}

export interface PathSection {
  id: string;
  title: string;
  /** Set when the path spans subjects; otherwise the path's subject applies. */
  subject?: string;
  lessons: string[];
  planned?: string[];
}

interface LearningPathDetails {
  id: string;
  title: string;
  shortTitle?: string;
  description: string;
  /** Omitted when every section names its own subject. */
  subject?: string;
  audience?: string;
  objectives?: { title: string; description: string }[];
  order?: number;
}

// Store order once: a short path can be flat, a longer path can group its lessons.
export type LearningPath = LearningPathDetails &
  (
    | { lessons: string[]; planned?: string[]; sections?: never }
    | { sections: PathSection[]; lessons?: never; planned?: never }
  );

export interface Source {
  id: string;
  name: string;
  kind: string;
  by?: string;
  url: string;
  prefixes?: string[];
}

export interface Problem {
  id: string;
  title: string;
  url: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lessons: string[];
  topics: string[];
  lists: string[];
  hints: string[];
}

export interface LessonReference {
  id: string;
  data: {
    path?: string;
    subject: string;
    prerequisites: string[];
    skills?: string[];
    sources?: { url: string }[];
    interviewQuestions?: { prompt: string }[];
  };
}

export interface CatalogInput {
  lessons: LessonReference[];
  paths: LearningPath[];
  subjects: Subject[];
  categories: Category[];
  skills?: Skill[];
  sources?: Source[];
  problems?: Problem[];
}

export const lessonUrl = (id: string, pathId?: string) =>
  `/learn/${id}/${pathId ? `?path=${encodeURIComponent(pathId)}` : ''}`;
export const pathUrl = (id: string) => `/paths/${id}/`;
export const subjectUrl = (id: string) => `/subjects/${id}/`;
export const categoryUrl = (id: string) =>
  `/explore/?category=${encodeURIComponent(id)}`;

export function pathSections(path: LearningPath): PathSection[] {
  return (
    path.sections ?? [
      {
        id: 'lessons',
        title: 'Lessons',
        lessons: path.lessons,
        planned: path.planned ?? [],
      },
    ]
  );
}

export function pathLessonIds(path: LearningPath): string[] {
  return pathSections(path).flatMap((section) => section.lessons);
}

export const plannedCount = (path: LearningPath) =>
  pathSections(path).reduce(
    (count, section) => count + (section.planned?.length ?? 0),
    0,
  );

export const pathLabel = (path: LearningPath) => path.shortTitle ?? path.title;

/** The subject a section teaches: its own, or the path's. */
export const sectionSubject = (path: LearningPath, section: PathSection) =>
  section.subject ?? path.subject;

/** The subjects a path teaches, in study order. */
export function pathSubjects(path: LearningPath): string[] {
  const ids = pathSections(path).map((section) =>
    sectionSubject(path, section),
  );
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

/** Root-first category trail, including the selected category. */
export function categoryAncestors(
  id: string,
  categories: Category[],
): Category[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const trail: Category[] = [];
  const seen = new Set<string>();
  let current: string | undefined = id;
  while (current) {
    if (seen.has(current)) throw new Error(`Category cycle: ${current}`);
    seen.add(current);
    const category = byId.get(current);
    if (!category) throw new Error(`Missing category reference: ${current}`);
    trail.unshift(category);
    current = category.parent;
  }
  return trail;
}

export function subjectsInCategory<T extends Subject>(
  id: string,
  subjects: T[],
  categories: Category[],
): T[] {
  return subjects.filter((subject) =>
    categoryAncestors(subject.category, categories).some(
      (category) => category.id === id,
    ),
  );
}

/** The registered source whose prefix matches a citation URL, if any. */
export function sourceForUrl(url: string, sources: Source[]) {
  return sources.find((source) =>
    (source.prefixes ?? [source.url]).some((prefix) => url.startsWith(prefix)),
  );
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const lessonIdPattern =
  /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

function assertUniqueIds(items: { id: string }[], kind: string) {
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error(`Duplicate ${kind} ID`);
  for (const item of items) {
    if (!slugPattern.test(item.id))
      throw new Error(`Invalid ${kind} ID: ${item.id}`);
  }
}

/** Reject cycles in a prerequisite graph. `edges` is undefined for an unknown node. */
function assertAcyclic(
  ids: string[],
  edges: (id: string) => string[] | undefined,
  label: string,
) {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) throw new Error(`${label} cycle: ${id}`);
    if (visited.has(id)) return;
    const next = edges(id);
    if (!next) throw new Error(`Missing ${label.toLowerCase()}: ${id}`);
    visiting.add(id);
    next.forEach(visit);
    visiting.delete(id);
    visited.add(id);
  }
  ids.forEach(visit);
}

export function validateTaxonomy(categories: Category[], subjects: Subject[]) {
  assertUniqueIds(categories, 'category');
  assertUniqueIds(subjects, 'subject');
  for (const category of categories) categoryAncestors(category.id, categories);
  const byId = new Map(subjects.map((subject) => [subject.id, subject]));
  for (const subject of subjects) {
    if (!categories.some((category) => category.id === subject.category))
      throw new Error(
        `Missing subject category reference: ${subject.category}`,
      );
    // A subject is either a prerequisite or related, at most once.
    const links = [
      ...(subject.prerequisites ?? []),
      ...(subject.related ?? []),
    ].map((link) => link.subject);
    if (new Set(links).size !== links.length)
      throw new Error(`Duplicate subject link: ${subject.id}`);
    for (const id of links) {
      if (id === subject.id || !byId.has(id))
        throw new Error(`Invalid subject link: ${subject.id} → ${id}`);
    }
  }
  assertAcyclic(
    subjects.map((subject) => subject.id),
    (id) => byId.get(id)?.prerequisites?.map((link) => link.subject) ?? [],
    'Subject prerequisite',
  );
}

function validateSkills(skills: Skill[], subjects: Subject[]) {
  assertUniqueIds(skills, 'skill');
  const known = new Set(skills.map((skill) => skill.id));
  for (const subject of subjects) {
    const ids = (subject.skills ?? []).map((entry) => entry.skill);
    if (new Set(ids).size !== ids.length)
      throw new Error(`Duplicate skill: ${subject.id}`);
    for (const id of ids) {
      if (!known.has(id))
        throw new Error(`Unknown skill: ${subject.id} → ${id}`);
    }
  }
  return known;
}

export function validateCatalog({
  lessons,
  paths,
  subjects,
  categories,
  skills = [],
  sources = [],
  problems = [],
}: CatalogInput) {
  validateTaxonomy(categories, subjects);
  const skillIds = validateSkills(skills, subjects);
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  if (byId.size !== lessons.length) throw new Error('Duplicate lesson ID');
  assertUniqueIds(paths, 'path');
  for (const path of paths) {
    if (path.subject && !subjectById.has(path.subject))
      throw new Error(`Missing path subject reference: ${path.subject}`);
    if ((path.lessons !== undefined) === (path.sections !== undefined))
      throw new Error(`Path must use either lessons or sections: ${path.id}`);
    const sections = pathSections(path);
    assertUniqueIds(sections, 'section');
    for (const section of sections) {
      if (!section.lessons.length && !section.planned?.length)
        throw new Error(`Empty path section: ${path.id}/${section.id}`);
      if (!sectionSubject(path, section))
        throw new Error(
          `Path ${path.id} needs a subject, or a subject on every section`,
        );
      if (section.subject && !subjectById.has(section.subject))
        throw new Error(
          `Missing section subject reference: ${path.id}/${section.id} → ${section.subject}`,
        );
    }
    // A path that teaches a subject's prerequisite teaches it first.
    const order = pathSubjects(path);
    order.forEach((id, index) => {
      for (const { subject: before } of subjectById.get(id)?.prerequisites ??
        []) {
        if (order.indexOf(before) > index)
          throw new Error(
            `Path ${path.id} teaches ${id} before its prerequisite ${before}`,
          );
      }
    });
    const ids = pathLessonIds(path);
    if (new Set(ids).size !== ids.length)
      throw new Error('Duplicate path entry');
    for (const id of ids) {
      if (!byId.has(id)) throw new Error(`Invalid path reference: ${id}`);
    }
  }
  for (const lesson of lessons) {
    if (!lessonIdPattern.test(lesson.id))
      throw new Error(`Invalid lesson ID: ${lesson.id}`);
    if (!subjectById.has(lesson.data.subject))
      throw new Error(
        `Missing lesson subject reference: ${lesson.data.subject}`,
      );
    if (
      lesson.id.includes('/') &&
      !lesson.id.startsWith(`${lesson.data.subject}/`)
    )
      throw new Error(`Lesson folder must match its subject: ${lesson.id}`);
    if (
      lesson.data.path &&
      !paths.some(
        (path) =>
          path.id === lesson.data.path &&
          pathLessonIds(path).includes(lesson.id),
      )
    )
      throw new Error(
        `Lesson ${lesson.id} names default path "${lesson.data.path}" but is not in it. Add it to that path's lessons.`,
      );
    if (
      new Set(lesson.data.prerequisites).size !==
      lesson.data.prerequisites.length
    )
      throw new Error(`Duplicate prerequisite: ${lesson.id}`);
    const prompts = (lesson.data.interviewQuestions ?? []).map(
      (question) => question.prompt,
    );
    if (new Set(prompts).size !== prompts.length)
      throw new Error(`Duplicate interview question: ${lesson.id}`);
    if (sources.length) {
      for (const { url } of lesson.data.sources ?? []) {
        if (!sourceForUrl(url, sources))
          throw new Error(`Unregistered source in ${lesson.id}: ${url}`);
      }
    }
    for (const id of lesson.data.skills ?? []) {
      if (!skillIds.has(id))
        throw new Error(`Unknown skill: ${lesson.id} → ${id}`);
    }
  }
  assertAcyclic(
    lessons.map((lesson) => lesson.id),
    (id) => byId.get(id)?.data.prerequisites,
    'Prerequisite',
  );
  validateProblems(problems, byId, sources);
}

function validateProblems(
  problems: Problem[],
  lessons: Map<string, LessonReference>,
  sources: Source[],
) {
  assertUniqueIds(problems, 'problem');
  const lists = new Set(
    sources
      .filter((source) => source.kind === 'problem-list')
      .map((source) => source.id),
  );
  for (const problem of problems) {
    for (const id of problem.lessons) {
      if (!lessons.has(id))
        throw new Error(`Invalid problem lesson: ${problem.id} → ${id}`);
    }
    for (const id of problem.lists) {
      if (!lists.has(id))
        throw new Error(`Unknown problem list: ${problem.id} → ${id}`);
    }
    if (sources.length && !sourceForUrl(problem.url, sources))
      throw new Error(`Unregistered problem source: ${problem.url}`);
  }
}

export function neighbors(ids: string[], id: string) {
  const index = ids.indexOf(id);
  return index < 0 ? {} : { previous: ids[index - 1], next: ids[index + 1] };
}
