// Content guard: drafts and labs must not ship placeholder text left by templates or agents.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const roots = [path.resolve('src/content'), path.resolve('labs')];
// Every content and lab file, except the learner's starter.
const checked = (file) =>
  /\.(mdx|md|ya?ml)$/.test(file) ||
  (file.includes(`${path.sep}labs${path.sep}`) &&
    /\.(ts|c|sh|mjs|java|go)$/.test(file) &&
    path.basename(file) !== 'starter.ts');
const markers =
  /\b(TODO|TBD|FIXME|XXX|lorem ipsum)\b|example\.(com|org)|replace-before/i;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    }),
  );
  return nested.flat();
}

const problems = [];
for (const file of (await Promise.all(roots.map(walk))).flat()) {
  if (!checked(file)) continue;
  const lines = (await readFile(file, 'utf8')).split('\n');
  lines.forEach((line, index) => {
    const match = line.match(markers);
    if (match)
      problems.push(
        `${path.relative(process.cwd(), file)}:${index + 1}: placeholder "${match[0]}"`,
      );
  });
}
if (problems.length) {
  console.error(
    `Replace placeholder content before committing:\n${problems.join('\n')}`,
  );
  process.exit(1);
}
console.log('Content has no placeholder markers.');
