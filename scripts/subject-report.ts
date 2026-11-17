// Inventory a subject (or one lesson) against docs/SUBJECT_STANDARD.md.
//
//   pnpm subject:report <subject>[/<lesson>] [--json]
//
// Advisory: it counts and flags what a script can see, so audits and
// self-checks never hand-count. It never fails the build; a flag is a prompt
// for judgment, keyed by the standard's property ID.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';

export type Level = 'warn' | 'info';
export interface Flag {
  id: string;
  level: Level;
  message: string;
}

export interface LabCardInfo {
  title: string;
  command: string;
  number: number | null;
}

/** What the standard can check from a lesson's MDX source alone. */
export interface LessonSource {
  minutes: number;
  objectives: number;
  interviewQuestions: number;
  followUps: number;
  sources: number;
  status: string;
  drafter: string;
  headings: string[];
  analogyStopsInHook: boolean;
  analogyStopsAnywhere: boolean;
  predictPrompts: number;
  predictsWithoutGate: number;
  checkAfterDisclosures: number;
  testedModelDisclosure: boolean;
  testsCheckParagraph: boolean;
  practiceHeading: boolean;
  labCards: LabCardInfo[];
  conceptChecks: { options: number; correct: number; explained: number }[];
  recapBullets: number;
  illustrative: number;
  learnLinks: number;
  componentImports: string[];
  rawImports: string[];
  codeExamples: number;
  verifiedOutputs: string[];
  verifiedWithoutOutput: number;
}

export interface LabInfo {
  directory: string;
  exists: boolean;
  files: string[];
  contractCases: number;
  bareToThrow: number;
  readmeTitle: string | null;
}

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;

function sectionsOf(body: string): { heading: string; text: string }[] {
  const parts = body.split(/^## /m);
  const result = [{ heading: '', text: parts[0] ?? '' }];
  for (const part of parts.slice(1)) {
    const newline = part.indexOf('\n');
    result.push({
      heading: part.slice(0, newline < 0 ? undefined : newline).trim(),
      text: newline < 0 ? '' : part.slice(newline + 1),
    });
  }
  return result;
}

/** Text with line breaks and runs of spaces collapsed. */
const flat = (text: string) => text.replace(/\s+/g, ' ');

/** Text with every <LabCard>…</LabCard> block removed. */
function withoutLabCards(text: string) {
  return text.replace(/<LabCard[\s\S]*?<\/LabCard>/g, '');
}

function attribute(tag: string, name: string): string {
  const match = tag.match(
    new RegExp(
      `${name}=(?:"([^"]*)"|'([^']*)'|\\{\\s*['"]([^'"]*)['"]\\s*\\})`,
    ),
  );
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : '';
}

/** The string literal of a CodeExample's `output`, with escapes resolved. */
function outputLiteral(tag: string): string | null {
  const match = tag.match(
    /output=(?:\{\s*(['"`])([\s\S]*?)\1\s*\}|(['"])([\s\S]*?)\3)/,
  );
  if (!match) return null;
  const text = match[2] ?? match[4] ?? '';
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

export function inspectLessonSource(source: string): LessonSource {
  const match = source.match(FRONTMATTER);
  if (!match) throw new Error('Lesson has no frontmatter');
  const data = (parse(match[1] ?? '') ?? {}) as Record<string, unknown>;
  const body = source.slice(match[0].length);
  const list = (key: string) =>
    Array.isArray(data[key]) ? (data[key] as unknown[]) : [];
  const questions = list('interviewQuestions') as { followUps?: unknown[] }[];
  const sections = sectionsOf(body);
  const headings = sections.slice(1).map((s) => s.heading);
  const practiceIndex = sections.findIndex((s) => /^Practi/i.test(s.heading));
  const beforePractice = sections
    .slice(0, practiceIndex < 0 ? sections.length : practiceIndex)
    .filter((s) => !/^(Check your reasoning|Two-minute recap)$/.test(s.heading))
    .map((s) => s.text)
    .join('\n');

  // A predict prompt is a paragraph outside lab cards that asks the learner to
  // predict. Its answer should be gated: the next block is a disclosure, a
  // widget or a lab card rather than plain prose.
  const blocks = withoutLabCards(beforePractice)
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  let predictPrompts = 0;
  let predictsWithoutGate = 0;
  blocks.forEach((block, index) => {
    if (block.startsWith('<') || block.startsWith('import ')) return;
    if (!/\bpredict\b/i.test(flat(block))) return;
    predictPrompts++;
    const next = blocks[index + 1] ?? '';
    if (!/^<(details|[A-Z]\w*[\s\S]*client:|LabCard)/.test(next))
      predictsWithoutGate++;
  });

  const labCards = [...body.matchAll(/<LabCard\b([\s\S]*?)>/g)].map((m) => {
    const tag = m[1] ?? '';
    const title = attribute(tag, 'title');
    const number = title.match(/^(\d{2}) \//);
    return {
      title,
      command: attribute(tag, 'command'),
      number: number ? Number(number[1]) : null,
    };
  });

  const conceptChecks = [...body.matchAll(/<ConceptCheck\b([\s\S]*?)\/>/g)].map(
    (m) => {
      const text = m[1] ?? '';
      return {
        options: (text.match(/\blabel:/g) ?? []).length,
        correct: (text.match(/\bcorrect:\s*true/g) ?? []).length,
        explained: (text.match(/\bexplanation:/g) ?? []).length,
      };
    },
  );

  const recap = sections.find((s) => s.heading === 'Two-minute recap');
  const codeTags = [...body.matchAll(/<CodeExample\b([\s\S]*?)\/>/g)].map(
    (m) => m[1] ?? '',
  );
  const verified = codeTags.filter((tag) => /\bverified\b/.test(tag));

  return {
    minutes: Number(data.estimatedMinutes ?? 0),
    objectives: list('learningObjectives').length,
    interviewQuestions: questions.length,
    followUps: questions.filter((q) => (q.followUps ?? []).length > 0).length,
    sources: list('sources').length,
    status: String(data.status ?? ''),
    drafter: String(data.drafter ?? ''),
    headings,
    analogyStopsInHook: /analogy stops at/i.test(flat(sections[1]?.text ?? '')),
    analogyStopsAnywhere: /analogy stops at/i.test(flat(body)),
    predictPrompts,
    predictsWithoutGate,
    checkAfterDisclosures: (body.match(/<summary>\s*Check after/g) ?? [])
      .length,
    testedModelDisclosure: /<summary>\s*Inspect the tested model/.test(body),
    testsCheckParagraph: /(^|\n\n)The tests check/.test(body),
    practiceHeading: practiceIndex >= 0,
    labCards,
    conceptChecks,
    recapBullets: recap ? (recap.text.match(/^- /gm) ?? []).length : 0,
    illustrative: (body.match(/illustrative/gi) ?? []).length,
    learnLinks: (body.match(/\]\(\/learn\//g) ?? []).length,
    componentImports: [
      ...body.matchAll(/^import \w+ from '([^']*components\/[^']+)';/gm),
    ].map((m) => m[1] ?? ''),
    rawImports: [...body.matchAll(/^import \w+ from '([^']+)\?raw';/gm)].map(
      (m) => m[1] ?? '',
    ),
    codeExamples: codeTags.length,
    verifiedOutputs: verified
      .map(outputLiteral)
      .filter((o): o is string => o !== null),
    verifiedWithoutOutput: verified.filter((t) => outputLiteral(t) === null)
      .length,
  };
}

export function inspectLab(
  directory: string,
  files: Record<string, string> | null,
): LabInfo {
  if (!files)
    return {
      directory,
      exists: false,
      files: [],
      contractCases: 0,
      bareToThrow: 0,
      readmeTitle: null,
    };
  const contracts = files['contracts.ts'] ?? '';
  const readme = files['README.md'];
  return {
    directory,
    exists: true,
    files: Object.keys(files).sort(),
    contractCases: (contracts.match(/\bit\(\s*['"`]unseen case \d+/g) ?? [])
      .length,
    bareToThrow: (contracts.match(/\.toThrow\(\s*\)/g) ?? []).length,
    readmeTitle: readme ? (readme.match(/^# (.+)$/m)?.[1] ?? '') : null,
  };
}

const REQUIRED_LAB_FILES = [
  'contracts.ts',
  'starter.ts',
  'exercises.attempt.test.ts',
  'practice.test.ts',
  'README.md',
];

export interface LessonContext {
  id: string;
  lesson: LessonSource;
  lab: LabInfo;
  /** Imported component path → whether its source imports from labs/. */
  components: Record<string, boolean>;
  /** Every verified output whose lines all appear in some lab test file. */
  outputsInTests: boolean[];
  /** Commands that point at a file or lab that does not exist. */
  unresolvedCommands: string[];
  problems: { id: string; lists: string[] }[];
}

export function lessonFlags(context: LessonContext): Flag[] {
  const { lesson: l, lab, id } = context;
  const slug = id.split('/')[1] ?? '';
  const flags: Flag[] = [];
  const warn = (flagId: string, message: string) =>
    flags.push({ id: flagId, level: 'warn', message });
  const info = (flagId: string, message: string) =>
    flags.push({ id: flagId, level: 'info', message });

  if (l.minutes > 45)
    warn('C4', `${l.minutes} minutes: above about 45, split the page`);
  else if (l.minutes > 30)
    warn('C4', `${l.minutes} minutes: above the 15–30 minute unit`);
  else if (l.minutes < 15) info('C4', `${l.minutes} minutes: below 15`);
  if (l.objectives < 2 || l.objectives > 4)
    warn('L1', `${l.objectives} learning objectives (expected 2–4)`);
  if (l.status !== 'draft' || l.drafter !== 'agent')
    info('W1', `status ${l.status}, drafter ${l.drafter}`);
  if (l.interviewQuestions < 3 || l.interviewQuestions > 6)
    warn('L2', `${l.interviewQuestions} interview questions (expected 3–6)`);
  if (!l.analogyStopsInHook)
    warn(
      'L3',
      l.analogyStopsAnywhere
        ? '"The analogy stops at" appears, but not in the first section'
        : 'no "The analogy stops at …" sentence',
    );
  if (l.predictPrompts === 0)
    warn('L5', 'no predict prompt in the body before Practice');
  if (l.predictsWithoutGate > 0)
    warn(
      'L6',
      `${l.predictsWithoutGate} predict prompt(s) followed by plain prose; check that the answer is not given away`,
    );
  if (!l.testedModelDisclosure)
    warn('L9', 'no "Inspect the tested model and expected output" disclosure');
  if (l.testedModelDisclosure && !l.testsCheckParagraph)
    info('L9', 'no paragraph starting "The tests check"');
  if (!l.practiceHeading) warn('L10', 'no heading starting "Practi"');
  if (l.labCards.length === 0) warn('L10', 'no LabCard');
  l.labCards.forEach((card, index) => {
    if (card.number !== index + 1)
      warn(
        'L10',
        `LabCard "${card.title}" should be numbered ${String(index + 1).padStart(2, '0')} /`,
      );
  });
  const first = l.labCards[0];
  if (first && !first.command.startsWith('pnpm lab '))
    warn('L10', `first LabCard runs "${first.command}", not "pnpm lab ${id}"`);
  for (const command of context.unresolvedCommands)
    warn('L10', `LabCard command points at nothing: ${command}`);
  if (l.conceptChecks.length !== 1)
    warn('L11', `${l.conceptChecks.length} ConceptChecks (expected 1)`);
  for (const check of l.conceptChecks) {
    if (check.options < 3)
      warn('L11', `ConceptCheck has ${check.options} options`);
    if (check.correct !== 1)
      warn('L11', `ConceptCheck has ${check.correct} correct options`);
    if (check.explained !== check.options)
      warn('L11', 'a ConceptCheck option has no explanation');
  }
  if (l.recapBullets < 3 || l.recapBullets > 6)
    warn('L12', `${l.recapBullets} recap bullets (expected 3–6)`);

  const figures = Object.keys(context.components);
  if (figures.length === 0) warn('V1', 'imports no diagram or widget');
  for (const [component, usesLabs] of Object.entries(context.components))
    if (!usesLabs)
      info(
        'V2',
        `${component.split('/').pop()} imports nothing from labs/; check for hand-typed values`,
      );
  for (const raw of l.rawImports)
    if (!raw.includes('/labs/'))
      warn('E1', `displays ${raw} from outside labs/`);
  context.outputsInTests.forEach((found, index) => {
    if (!found)
      warn(
        'E2',
        `verified output ${index + 1} is not asserted line by line in a lab test`,
      );
  });
  if (l.verifiedWithoutOutput > 0)
    info(
      'E2',
      `${l.verifiedWithoutOutput} verified CodeExample(s) without output`,
    );

  if (!lab.exists) warn('P1', `no lab at ${lab.directory}`);
  else {
    if (lab.directory.split('/').pop() !== slug)
      info('P1', `lab folder ${lab.directory} does not match the slug ${slug}`);
    for (const file of REQUIRED_LAB_FILES)
      if (!lab.files.includes(file)) warn('P1', `lab has no ${file}`);
    if (lab.contractCases < 5)
      warn(
        'P2',
        `${lab.contractCases} "unseen case" contracts (expected at least 5)`,
      );
    if (lab.bareToThrow > 0)
      warn('P2', `${lab.bareToThrow} bare toThrow() in contracts`);
    if (lab.readmeTitle !== null && lab.readmeTitle !== 'Independent practice')
      info('P6', `README title is "${lab.readmeTitle}"`);
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Repository loading

interface Section {
  id?: string;
  title?: string;
  subject?: string;
  lessons?: string[];
  planned?: string[];
}
interface PathFile {
  subject?: string;
  lessons?: string[];
  planned?: string[];
  sections?: Section[];
}

function readYaml<T>(file: string): T {
  return parse(readFileSync(file, 'utf8')) as T;
}

function filesIn(directory: string): Record<string, string> | null {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) return null;
  const files: Record<string, string> = {};
  for (const name of readdirSync(directory)) {
    const full = join(directory, name);
    if (statSync(full).isFile()) files[name] = readFileSync(full, 'utf8');
  }
  return files;
}

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

export interface Chapter {
  path: string;
  id: string;
  title: string;
  lessons: string[];
  planned: string[];
}

export interface SubjectReport {
  subject: string;
  title: string;
  hasOverview: boolean;
  overviewChapters: number;
  chapters: Chapter[];
  lessons: (LessonContext & { flags: Flag[] })[];
  /** Lessons in the subject folder that no path lists. */
  unlisted: string[];
  /** Planned titles that also appear elsewhere, with where. */
  duplicatePlanned: { title: string; places: string[] }[];
  flags: Flag[];
}

export function buildReport(root: string, target: string): SubjectReport {
  const [subject, only] = target.split('/');
  if (!subject) throw new Error('Name a subject, such as dsa');
  const subjectFile = join(root, 'src/content/subjects', `${subject}.yaml`);
  if (!existsSync(subjectFile)) throw new Error(`Unknown subject ${subject}`);
  const subjectData = readYaml<{
    title: string;
    overview?: { chapters?: unknown[] };
  }>(subjectFile);

  const chapters: Chapter[] = [];
  const plannedPlaces = new Map<string, string[]>();
  const pathDir = join(root, 'src/content/paths');
  for (const name of readdirSync(pathDir).filter((n) => n.endsWith('.yaml'))) {
    const pathId = name.replace(/\.yaml$/, '');
    const data = readYaml<PathFile>(join(pathDir, name));
    const sections: Section[] = data.sections ?? [
      {
        id: pathId,
        title: pathId,
        subject: data.subject,
        lessons: data.lessons,
        planned: data.planned,
      },
    ];
    for (const section of sections) {
      const sectionSubject = section.subject ?? data.subject;
      for (const title of section.planned ?? []) {
        const key = title.trim().toLowerCase();
        plannedPlaces.set(key, [
          ...(plannedPlaces.get(key) ?? []),
          `${pathId}#${section.id ?? pathId} (${title})`,
        ]);
      }
      if (sectionSubject !== subject) continue;
      chapters.push({
        path: pathId,
        id: section.id ?? pathId,
        title: section.title ?? pathId,
        lessons: section.lessons ?? [],
        planned: section.planned ?? [],
      });
    }
  }
  const duplicatePlanned = [...plannedPlaces.entries()]
    .filter(([, places]) => places.length > 1)
    .filter(([key]) =>
      chapters.some((c) =>
        c.planned.some((p) => p.trim().toLowerCase() === key),
      ),
    )
    .map(([, places]) => ({
      title: places[0]!.replace(/^.*\((.*)\)$/, '$1'),
      places,
    }));

  const lessonDir = join(root, 'src/content/lessons', subject);
  const lessonIds = walk(lessonDir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => `${subject}/${relative(lessonDir, f).replace(/\.mdx$/, '')}`)
    .sort();
  const listed = new Set(chapters.flatMap((c) => c.lessons));
  const order = chapters.flatMap((c) => c.lessons);
  lessonIds.sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib) || a.localeCompare(b);
  });

  const problemsDir = join(root, 'src/content/problems');
  const problems = readdirSync(problemsDir)
    .filter((n) => n.endsWith('.yaml'))
    .map((n) => ({
      id: n.replace(/\.yaml$/, ''),
      ...readYaml<{ lessons?: string[]; lists?: string[] }>(
        join(problemsDir, n),
      ),
    }));

  const labRoot = join(root, 'labs', subject);
  const labTests = walk(labRoot)
    .filter((f) => f.endsWith('.test.ts'))
    .map((f) => readFileSync(f, 'utf8'));

  const lessons = lessonIds
    .filter((id) => !only || id === `${subject}/${only}`)
    .map((id) => {
      const file = join(root, 'src/content/lessons', `${id}.mdx`);
      const lesson = inspectLessonSource(readFileSync(file, 'utf8'));
      const attempt = lesson.labCards
        .map((c) => c.command.match(/^pnpm lab (\S+)$/)?.[1])
        .find(Boolean);
      const labId = attempt ?? id;
      const labDirectory = `labs/${labId}`;
      const lab = inspectLab(labDirectory, filesIn(join(root, labDirectory)));
      const components: Record<string, boolean> = {};
      for (const imported of lesson.componentImports) {
        const base = resolve(dirname(file), imported);
        const candidate = [base, `${base}.tsx`, `${base}.astro`].find(
          (p) => existsSync(p) && statSync(p).isFile(),
        );
        const text = candidate ? readFileSync(candidate, 'utf8') : '';
        components[relative(root, candidate ?? base)] =
          /from ['"][^'"]*\/labs\//.test(text);
      }
      const unresolvedCommands = lesson.labCards
        .map((c) => c.command)
        .filter((command) => {
          const labMatch = command.match(/^pnpm lab (\S+)$/);
          if (labMatch)
            return !existsSync(
              join(root, 'labs', labMatch[1]!, 'exercises.attempt.test.ts'),
            );
          const vitest = command.match(/^pnpm exec vitest run (\S+)$/);
          if (vitest) return !existsSync(join(root, vitest[1]!));
          return false;
        });
      const outputsInTests = lesson.verifiedOutputs.map((output) =>
        output
          .split('\n')
          .filter((line) => line.trim())
          .every((line) => labTests.some((test) => test.includes(line))),
      );
      const context: LessonContext = {
        id,
        lesson,
        lab,
        components,
        outputsInTests,
        unresolvedCommands,
        problems: problems
          .filter((p) => (p.lessons ?? []).includes(id))
          .map((p) => ({ id: p.id, lists: p.lists ?? [] })),
      };
      return { ...context, flags: lessonFlags(context) };
    });

  const flags: Flag[] = [];
  const unlisted = lessonIds.filter((id) => !listed.has(id));
  for (const id of unlisted)
    flags.push({
      id: 'C3',
      level: 'warn',
      message: `${id} is in no path section`,
    });
  for (const duplicate of duplicatePlanned)
    flags.push({
      id: 'C5',
      level: 'warn',
      message: `planned title "${duplicate.title}" appears in ${duplicate.places.join(', ')}`,
    });
  const overviewChapters = subjectData.overview?.chapters?.length ?? 0;
  if (overviewChapters > 0 && chapters.length > 1)
    flags.push({
      id: 'C8',
      level: 'warn',
      message:
        'overview.chapters remains while path sections divide the subject',
    });
  if (chapters.length === 0)
    flags.push({
      id: 'C3',
      level: 'warn',
      message: 'no path section teaches this subject',
    });

  return {
    subject,
    title: subjectData.title,
    hasOverview: Boolean(subjectData.overview),
    overviewChapters,
    chapters,
    lessons,
    unlisted,
    duplicatePlanned,
    flags,
  };
}

// ---------------------------------------------------------------------------
// Markdown output

const yes = (value: boolean) => (value ? 'yes' : 'no');

export function toMarkdown(report: SubjectReport): string {
  const out: string[] = [];
  const plannedCount = report.chapters.reduce(
    (n, c) => n + c.planned.length,
    0,
  );
  out.push(`# Subject report: ${report.title} (\`${report.subject}\`)`, '');
  out.push(
    `${report.chapters.length} chapter section(s), ${report.lessons.length} lesson(s) reported, ${plannedCount} planned topic(s). Overview: ${report.hasOverview ? 'yes' : 'no'}${report.overviewChapters ? ` (with ${report.overviewChapters} sketched chapters)` : ''}. Advisory; see docs/SUBJECT_STANDARD.md for each ID.`,
    '',
  );
  out.push('## Chapters', '');
  for (const chapter of report.chapters) {
    out.push(
      `- **${chapter.title}** (\`${chapter.path}#${chapter.id}\`): ${chapter.lessons.length} lesson(s), ${chapter.planned.length} planned`,
    );
    for (const title of chapter.planned) out.push(`  - planned: ${title}`);
  }
  if (report.lessons.length) {
    out.push('', '## Lessons', '');
    out.push(
      '| Lesson | Min | Obj | IQ | Src | Predict (ungated) | Check-after | Model disclosure | Cards | Checks | Recap | Figures (from labs) | Verified (in tests) | Lab cases | Problems |',
      '| --- | --: | --: | --: | --: | --- | --: | --- | --: | --: | --: | --- | --- | --: | --: |',
    );
    for (const entry of report.lessons) {
      const l = entry.lesson;
      const figures = Object.values(entry.components);
      out.push(
        `| ${entry.id.split('/')[1]} | ${l.minutes} | ${l.objectives} | ${l.interviewQuestions} | ${l.sources} | ${l.predictPrompts} (${l.predictsWithoutGate}) | ${l.checkAfterDisclosures} | ${yes(l.testedModelDisclosure)} | ${l.labCards.length} | ${l.conceptChecks.length} | ${l.recapBullets} | ${figures.length} (${figures.filter(Boolean).length}) | ${l.verifiedOutputs.length} (${entry.outputsInTests.filter(Boolean).length}) | ${entry.lab.exists ? entry.lab.contractCases : '–'} | ${entry.problems.length} |`,
      );
    }
  }
  const allFlags = [
    ...report.flags.map((f) => ({ ...f, where: report.subject })),
    ...report.lessons.flatMap((entry) =>
      entry.flags.map((f) => ({
        ...f,
        where: entry.id.split('/')[1] ?? entry.id,
      })),
    ),
  ];
  out.push('', `## Flags (${allFlags.length})`, '');
  if (!allFlags.length) out.push('None.');
  const counts = new Map<string, number>();
  for (const flag of allFlags)
    counts.set(flag.id, (counts.get(flag.id) ?? 0) + 1);
  if (allFlags.length)
    out.push(
      `By property: ${[...counts.entries()].map(([id, n]) => `${id} ${n}`).join(', ')}.`,
      '',
    );
  for (const flag of allFlags)
    out.push(
      `- ${flag.level === 'warn' ? '⚠' : 'ℹ'} **${flag.id}** ${flag.where}: ${flag.message}`,
    );
  return out.join('\n') + '\n';
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith('--'));
  if (!target) {
    console.error('Usage: pnpm subject:report <subject>[/<lesson>] [--json]');
    process.exit(1);
  }
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  try {
    const report = buildReport(root, target);
    process.stdout.write(
      args.includes('--json')
        ? JSON.stringify(report, null, 2) + '\n'
        : toMarkdown(report),
    );
  } catch (error) {
    console.error(`✖ ${(error as Error).message}`);
    process.exit(1);
  }
}
