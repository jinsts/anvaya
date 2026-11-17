import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  buildReport,
  inspectLab,
  inspectLessonSource,
  lessonFlags,
  toMarkdown,
  type LessonContext,
} from '../../scripts/subject-report';

const frontmatter = (minutes: number, objectives = 3, questions = 3) =>
  [
    '---',
    "title: 'Thing: a hook'",
    'summary: A concrete sentence about the thing.',
    'subject: demo',
    'difficulty: foundation',
    `estimatedMinutes: ${minutes}`,
    'learningObjectives:',
    ...Array.from(
      { length: objectives },
      (_, i) => `  - Objective number ${i}`,
    ),
    'status: draft',
    'drafter: agent',
    'interviewQuestions:',
    ...Array.from({ length: questions }, (_, i) => [
      `  - prompt: Question number ${i}?`,
      '    answer: An answer that is long enough.',
      ...(i === 0 ? ['    followUps: [Why is that so?]'] : []),
    ]).flat(),
    'sources:',
    '  - label: A page',
    '    url: https://tc39.es/ecma262/',
    '---',
    '',
  ].join('\n');

const goodBody = `
import Figure from '../../../components/diagrams/Figure.astro';
import model from '../../../../labs/demo/thing/example.ts?raw';

## A concrete hook

A scenario. An analogy follows. The analogy
stops at scale: real things differ.

## The mechanism

<Figure />

Predict the result before you read on.

<details>
<summary>Check after predicting</summary>

It is 4.

</details>

<details>
<summary>Inspect the tested model and expected output</summary>

<CodeExample title="Model" code={model} verified output={'a: 1\\nb: 2'} />

</details>

The tests check every case.

## Practice

<LabCard title="01 / Attempt" command="pnpm lab demo/thing">
  Implement it.
</LabCard>

<LabCard title="02 / Extend" command="pnpm exec vitest run labs/demo/thing/">
  Add a case.
</LabCard>

## Check your reasoning

<ConceptCheck
  id="thing-check"
  question="Why?"
  options={[
    { label: 'Right', correct: true, explanation: 'Because.' },
    { label: 'Wrong', explanation: 'Because not.' },
    { label: 'Also wrong', explanation: 'Because not either.' },
  ]}
/>

## Two-minute recap

- One.
- Two.
- Three.
`;

describe('inspectLessonSource', () => {
  it('reads the anatomy of a lesson that meets the standard', () => {
    const lesson = inspectLessonSource(frontmatter(25) + goodBody);
    expect(lesson).toMatchObject({
      minutes: 25,
      objectives: 3,
      interviewQuestions: 3,
      followUps: 1,
      sources: 1,
      analogyStopsInHook: true,
      predictPrompts: 1,
      predictsWithoutGate: 0,
      checkAfterDisclosures: 1,
      testedModelDisclosure: true,
      testsCheckParagraph: true,
      practiceHeading: true,
      recapBullets: 3,
      codeExamples: 1,
      verifiedOutputs: ['a: 1\nb: 2'],
    });
    expect(lesson.labCards.map((c) => c.number)).toEqual([1, 2]);
    expect(lesson.conceptChecks).toEqual([
      { options: 3, correct: 1, explained: 3 },
    ]);
    expect(lesson.componentImports).toEqual([
      '../../../components/diagrams/Figure.astro',
    ]);
  });

  it('notices an answer given in prose right after a prompt', () => {
    const body = goodBody.replace(
      '<details>\n<summary>Check after predicting',
      'The answer is 4.\n\n<details>\n<summary>Check after predicting',
    );
    expect(
      inspectLessonSource(frontmatter(25) + body).predictsWithoutGate,
    ).toBe(1);
  });

  it('does not count words such as predictor as prompts', () => {
    const body = goodBody.replace(
      'Predict the result before you read on.',
      'A predictor guesses each branch.',
    );
    expect(inspectLessonSource(frontmatter(25) + body).predictPrompts).toBe(0);
  });

  it('rejects a file without frontmatter', () => {
    expect(() => inspectLessonSource('## No frontmatter')).toThrow(
      'no frontmatter',
    );
  });
});

describe('inspectLab', () => {
  it('counts hidden contracts and bare throws', () => {
    const lab = inspectLab('labs/demo/thing', {
      'contracts.ts': [
        "it('unseen case 1', () => {});",
        "it('unseen case 2', () => expect(f).toThrow());",
        "it('shows 3', () => {});",
      ].join('\n'),
      'README.md': '# Independent practice\n',
    });
    expect(lab).toMatchObject({
      exists: true,
      contractCases: 2,
      bareToThrow: 1,
      readmeTitle: 'Independent practice',
    });
    expect(inspectLab('labs/none', null).exists).toBe(false);
  });
});

describe('lessonFlags', () => {
  const context = (
    minutes: number,
    body = goodBody,
    overrides: Partial<LessonContext> = {},
  ): LessonContext => ({
    id: 'demo/thing',
    lesson: inspectLessonSource(frontmatter(minutes) + body),
    lab: inspectLab('labs/demo/thing', {
      'contracts.ts': Array.from(
        { length: 5 },
        (_, i) => `it('unseen case ${i + 1}', () => {});`,
      ).join('\n'),
      'starter.ts': '',
      'exercises.attempt.test.ts': '',
      'practice.test.ts': '',
      'README.md': '# Independent practice\n',
    }),
    components: { 'src/components/diagrams/Figure.astro': true },
    outputsInTests: [true],
    unresolvedCommands: [],
    problems: [],
    ...overrides,
  });

  it('raises nothing for a lesson that meets the standard', () => {
    expect(lessonFlags(context(25))).toEqual([]);
  });

  it('flags long pages, with a split above 45 minutes', () => {
    expect(lessonFlags(context(35)).map((f) => f.message)).toEqual([
      '35 minutes: above the 15–30 minute unit',
    ]);
    expect(lessonFlags(context(50))[0]?.message).toContain('split the page');
  });

  it('flags numbering, missing labs and unasserted outputs', () => {
    const body = goodBody.replace('01 / Attempt', 'Attempt');
    const flags = lessonFlags(
      context(25, body, {
        lab: inspectLab('labs/demo/thing', null),
        outputsInTests: [false],
        components: { 'src/components/diagrams/Figure.astro': false },
      }),
    );
    expect(flags.map((f) => f.id)).toEqual(['L10', 'V2', 'E2', 'P1']);
  });
});

describe('buildReport', () => {
  const root = mkdtempSync(join(tmpdir(), 'anvaya-report-'));
  const write = (file: string, text: string) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  };
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  write('src/content/subjects/demo.yaml', 'title: Demo\n');
  write('src/content/subjects/other.yaml', 'title: Other\n');
  write(
    'src/content/paths/main.yaml',
    [
      'title: Main',
      'sections:',
      '  - id: demo-one',
      '    title: One',
      '    subject: demo',
      '    lessons: [demo/thing]',
      '    planned: [Shared topic]',
      '  - id: other',
      '    title: Other',
      '    subject: other',
      '    planned: [shared topic]',
      '',
    ].join('\n'),
  );
  write('src/content/problems/p.yaml', 'lessons: [demo/thing]\nlists: [x]\n');
  write('src/content/lessons/demo/thing.mdx', frontmatter(25) + goodBody);
  write('src/content/lessons/demo/stray.mdx', frontmatter(20) + goodBody);
  write(
    'src/components/diagrams/Figure.astro',
    "---\nimport { m } from '../../../labs/demo/thing/example';\n---\n",
  );
  write('labs/demo/thing/exercises.attempt.test.ts', '');
  write('labs/demo/thing/example.test.ts', "expect(x).toBe('a: 1\\nb: 2');");

  it('collects chapters, lessons, problems and subject-level flags', () => {
    const report = buildReport(root, 'demo');
    expect(report.chapters).toHaveLength(1);
    expect(report.lessons.map((l) => l.id)).toEqual([
      'demo/thing',
      'demo/stray',
    ]);
    const thing = report.lessons[0]!;
    expect(thing.components).toEqual({
      'src/components/diagrams/Figure.astro': true,
    });
    expect(thing.outputsInTests).toEqual([true]);
    expect(thing.unresolvedCommands).toEqual([]);
    expect(thing.problems).toEqual([{ id: 'p', lists: ['x'] }]);
    expect(report.unlisted).toEqual(['demo/stray']);
    expect(report.flags.map((f) => f.id)).toEqual(['C3', 'C5']);
    expect(toMarkdown(report)).toContain('| thing | 25 |');
  });

  it('reports one lesson and rejects unknown subjects', () => {
    expect(buildReport(root, 'demo/thing').lessons).toHaveLength(1);
    expect(() => buildReport(root, 'missing')).toThrow('Unknown subject');
  });
});
