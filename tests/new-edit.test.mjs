import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createEditProject, parseArgs } from '../scripts/new-edit.mjs';

const root = resolve(import.meta.dirname, '..');
function scratch(t) {
  const path = mkdtempSync(join(tmpdir(), 'mrbizntech-intake-'));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  return path;
}

test('default intake works without installed rendering dependencies or media', t => {
  const projectRoot = scratch(t);
  const dest = createEditProject({ projectRoot, slug: 'first-story' });
  const brief = JSON.parse(readFileSync(join(dest, 'EDIT-BRIEF.json')));
  assert.equal(brief.preset, 'off-camera');
  assert.equal(brief.editing.face_camera_required, false);
  assert.equal(brief.stage, 'intake');
  assert.deepEqual(brief.candidates, []);
  assert.equal(brief.transcript, null);
  assert.equal(brief.outputs.threads.caption_max_characters, 499);
  assert.match(brief.editing.off_camera_policy, /does not imply the audible voice is Dennis/);
  assert.equal(existsSync(join(dest, 'index.html')), false);
});

test('multiple files with identical basenames remain distinct and originals stay unchanged', t => {
  const projectRoot = scratch(t);
  const a = join(projectRoot, 'a'), b = join(projectRoot, 'b');
  mkdirSync(a); mkdirSync(b);
  const first = join(a, 'episode.mov'), second = join(b, 'episode.mov');
  writeFileSync(first, 'first source bytes'); writeFileSync(second, 'second source bytes');
  const dest = createEditProject({ projectRoot, slug: 'podcast-pieces', preset: 'podcast', sources: [first, second] });
  const brief = JSON.parse(readFileSync(join(dest, 'EDIT-BRIEF.json')));
  assert.equal(brief.sources.length, 2);
  assert.notEqual(brief.sources[0].path, brief.sources[1].path);
  assert.equal(readFileSync(join(dest, brief.sources[0].path), 'utf8'), 'first source bytes');
  assert.equal(readFileSync(join(dest, brief.sources[1].path), 'utf8'), 'second source bytes');
  assert.equal(readFileSync(first, 'utf8'), 'first source bytes');
  assert.equal(readFileSync(second, 'utf8'), 'second source bytes');
});

test('an invalid later source leaves no partial project or copy', t => {
  const projectRoot = scratch(t), source = join(projectRoot, 'valid.mp4');
  writeFileSync(source, 'source bytes');
  assert.throws(() => createEditProject({ projectRoot, slug: 'bad-batch', sources: [source, join(projectRoot, 'missing.mp4')] }));
  assert.equal(existsSync(join(projectRoot, 'video-projects/bad-batch')), false);
});

test('rejects path traversal, unknown presets and existing projects without overwriting', t => {
  const projectRoot = scratch(t);
  for (const slug of ['../escape', 'a/b', '/tmp/escape', 'UPPER']) {
    assert.throws(() => createEditProject({ projectRoot, slug }));
  }
  for (const preset of ['missing', '__proto__', 'constructor']) {
    assert.throws(() => createEditProject({ projectRoot, slug: 'bad-preset', preset }));
  }
  const dest = createEditProject({ projectRoot, slug: 'existing', preset: 'podcast-full' });
  const original = readFileSync(join(dest, 'EDIT-BRIEF.json'), 'utf8');
  assert.throws(() => createEditProject({ projectRoot, slug: 'existing' }), /already exists/);
  assert.equal(readFileSync(join(dest, 'EDIT-BRIEF.json'), 'utf8'), original);
  const brief = JSON.parse(original);
  assert.deepEqual(Object.keys(brief.outputs), ['youtube_long', 'facebook']);
  assert.equal(brief.editing.duration_target_seconds, null);
});

test('CLI accepts repeated source flags and fails on ambiguous or malformed options', () => {
  assert.deepEqual(parseArgs(['story', '--source', 'one.mp4', '--preset', 'podcast', '--source', 'two.wav']), {
    slug: 'story', preset: 'podcast', sources: ['one.mp4', 'two.wav'],
  });
  for (const args of [[], ['../escape'], ['story', '--preset'], ['story', '--source', '--preset'], ['story', '--wat'], ['story', '--preset', 'direct', '--preset', 'podcast']]) {
    assert.throws(() => parseArgs(args));
  }
  const result = spawnSync(process.execPath, [join(root, 'scripts/new-edit.mjs'), '--list'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /off-camera: Off-camera story/);
  assert.match(result.stdout, /podcast-full: Full podcast episode/);
});

test('new intake workspaces are ignored by the existing repository rules', () => {
  const result = spawnSync('git', ['check-ignore', '--stdin'], {
    cwd: root, encoding: 'utf8', input: 'video-projects/example-story/EDIT-BRIEF.json\nvideo-projects/example-story/assets/source/episode.mp4\n',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim().split('\n').length, 2);
});
