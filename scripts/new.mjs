// Scaffold content from templates/. Usage:
//   pnpm new:lesson <subject>/<slug> [--title "Title"] [--path <path-id>]
// Every lesson gets an attempt lab (docs/SUBJECT_STANDARD.md, P1).
//   pnpm new:problem <slug> --title "Title" --url <url> --difficulty <easy|medium|hard> --lesson <subject>/<slug>
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const [kind, id, ...rest] = process.argv.slice(2);
const options = {};
for (let index = 0; index < rest.length; index++) {
  const flag = rest[index];
  if (!flag?.startsWith('--')) fail(`Unexpected argument: ${flag}`);
  const next = rest[index + 1];
  if (next && !next.startsWith('--')) {
    options[flag.slice(2)] = next;
    index++;
  } else options[flag.slice(2)] = true;
}

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}
const exists = (file) =>
  access(file).then(
    () => true,
    () => false,
  );
const titleCase = (text) =>
  text.replace(/-/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
const fill = (text, values) =>
  Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`__${key}__`, value),
    text,
  );

async function writeNew(file, text) {
  if (await exists(file)) fail(`${file} already exists.`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text);
  console.log(`✔ created ${file}`);
}

async function newLesson() {
  const [subject, name, extra] = (id ?? '').split('/');
  if (!subject || !name || extra || !slug.test(subject) || !slug.test(name))
    fail('Give a lesson ID such as dsa/two-pointers.');
  if (!(await exists(`src/content/subjects/${subject}.yaml`)))
    fail(
      `Unknown subject "${subject}". Add src/content/subjects/${subject}.yaml first.`,
    );
  if (options.path && !(await exists(`src/content/paths/${options.path}.yaml`)))
    fail(`Unknown path "${options.path}".`);
  const title =
    typeof options.title === 'string' ? options.title : titleCase(name);
  let lesson = fill(await readFile('templates/lesson.mdx', 'utf8'), {
    TITLE: title.replaceAll("'", "''"),
    SHORT_TITLE: title.split(':')[0].replaceAll("'", "''"),
    SUBJECT: subject,
    SLUG: name,
  });
  if (options.path)
    lesson = lesson.replace(
      `subject: ${subject}\n`,
      `subject: ${subject}\npath: ${options.path}\n`,
    );
  await writeNew(`src/content/lessons/${subject}/${name}.mdx`, lesson);
  for (const file of await readdir('templates/lab'))
    await writeNew(
      `labs/${subject}/${name}/${file}`,
      fill(await readFile(`templates/lab/${file}`, 'utf8'), {
        TITLE: title,
        ID: `${subject}/${name}`,
      }),
    );
  console.log(`
Next steps (docs/playbooks/add-lesson.md, or the draft-lesson skill):
  1. ${options.path ? `Move the topic from planned to lessons in src/content/paths/${options.path}.yaml.` : 'Add the lesson to a path section in src/content/paths/.'}
  2. Build the lab first: the model and its tests, then contracts, then figures.
  3. Replace every TODO; cite registered sources you opened.
  4. Check with pnpm subject:report ${subject}/${name} and pnpm lab ${subject}/${name} (it must fail).
  5. Run pnpm verify and review pnpm shots ${subject}/${name} (docs/playbooks/verify-change.md).`);
}

async function newProblem() {
  if (!id || !slug.test(id)) fail('Give a problem slug such as two-sum.');
  const { title, url, difficulty, lesson } = options;
  if (typeof title !== 'string' || typeof url !== 'string')
    fail('Pass --title and --url.');
  if (!['easy', 'medium', 'hard'].includes(difficulty))
    fail('Pass --difficulty easy, medium or hard.');
  if (
    typeof lesson !== 'string' ||
    !(await exists(`src/content/lessons/${lesson}.mdx`))
  )
    fail('Pass --lesson with an existing lesson ID, such as dsa/hash-maps.');
  await writeNew(
    `src/content/problems/${id}.yaml`,
    fill(await readFile('templates/problem.yaml', 'utf8'), {
      TITLE: title,
      URL: url,
      DIFFICULTY: difficulty,
      LESSON: lesson,
    }),
  );
  console.log(
    '\nNext: add topics and verified list memberships, replace the TODO hints, then run pnpm lint && pnpm build.',
  );
}

if (kind === 'lesson') await newLesson();
else if (kind === 'problem') await newProblem();
else fail('Use: node scripts/new.mjs lesson|problem <id> [options]');
