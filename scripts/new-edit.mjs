#!/usr/bin/env node
import { constants, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const profile = JSON.parse(readFileSync(join(root, 'config/mrbizntech-editing.json'), 'utf8'));
const mediaTypes = new Map([
  ...['.mp4', '.mov', '.mkv', '.webm', '.m4v'].map(ext => [ext, 'video']),
  ...['.wav', '.mp3', '.m4a', '.aac', '.flac', '.ogg'].map(ext => [ext, 'audio']),
  ...['.png', '.jpg', '.jpeg', '.webp'].map(ext => [ext, 'image']),
]);
const usage = 'Usage: npm run new-edit -- <lowercase-project-slug> [--preset off-camera|podcast|podcast-full|direct] [--source <local-media-path>]...\n       npm run new-edit -- --list';

export function parseArgs(args) {
  if (args.length === 1 && ['--help', '--list'].includes(args[0])) return { action: args[0] };
  const [slug, ...rest] = args;
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Use a lowercase kebab-case project slug, not a path.');
  const options = { slug, preset: 'off-camera', sources: [] };
  let presetSeen = false;
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    if (!['--preset', '--source'].includes(flag)) throw new Error(`Unknown option: ${flag}`);
    const value = rest[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}.`);
    if (flag === '--source') options.sources.push(value);
    else {
      if (presetSeen) throw new Error('Specify --preset only once.');
      options.preset = value;
      presetSeen = true;
    }
  }
  return options;
}

// projectRoot is injectable so tests never create projects in a real media workspace.
export function createEditProject({ slug, preset = 'off-camera', sources = [], projectRoot = root }) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? '')) throw new Error('Invalid project slug.');
  if (!Object.hasOwn(profile.presets, preset)) throw new Error(`Unknown preset: ${preset}. Use --list.`);
  const dest = join(projectRoot, 'video-projects', slug);
  if (existsSync(dest)) throw new Error(`Project already exists: ${slug}. Choose a new name.`);
  // Validate every source before creating or copying anything. No network or paid calls.
  const inputs = sources.map(input => {
    const path = resolve(input);
    const kind = mediaTypes.get(extname(path).toLowerCase());
    if (!kind) throw new Error(`Unsupported media extension: ${basename(path)}`);
    if (!statSync(path).isFile()) throw new Error(`Source must be a file: ${basename(path)}`);
    return { path, kind };
  });
  mkdirSync(dirname(dest), { recursive: true });
  mkdirSync(dest); // Exclusive creation protects an existing project, including concurrent runs.
  try {
    for (const dir of ['assets/source', 'transcripts', 'reviews', 'renders']) mkdirSync(join(dest, dir), { recursive: true });
    const inventory = inputs.map(({ path, kind }, index) => {
      const id = `source-${String(index + 1).padStart(3, '0')}`;
      const safeName = basename(path).replace(/[^a-zA-Z0-9._-]/g, '_');
      const localPath = `assets/source/${id}-${safeName}`;
      copyFileSync(path, join(dest, localPath), constants.COPYFILE_EXCL);
      return { id, path: localPath, original_name: basename(path), kind, speaker_ids: [], notes: '' };
    });
    const brief = {
      version: profile.version,
      project: slug,
      stage: 'intake',
      preset,
      brand: profile.brand,
      editing: { ...profile.shared, ...profile.presets[preset] },
      references: profile.references,
      outputs: Object.fromEntries(profile.presets[preset].outputs.map(key => [key, profile.platforms[key]])),
      sources: inventory,
      speakers: [],
      transcript: null,
      candidates: [],
      review: { draft_approved: false, notes: [] },
    };
    writeFileSync(join(dest, 'EDIT-BRIEF.json'), JSON.stringify(brief, null, 2) + '\n');
    writeFileSync(join(dest, 'DESIGN.md'), `# ${slug}: ${profile.presets[preset].name}\n\n` +
      `Read EDIT-BRIEF.json before editing. Its project-specific choices take precedence over Nate's measured house reel style.\n\n` +
      `## Direction\n\n${profile.brand.direction}\n\n${profile.brand.palette}\n\n${profile.brand.typography}\n\n` +
      `## Layout and rhythm\n\n${profile.presets[preset].layout}\n\n${profile.presets[preset].pacing}\n\n` +
      `## Source fidelity\n\n${profile.shared.attribution}\n\n${profile.shared.source_mapping}\n\n` +
      `## Current state\n\nThis is an intake brief, not a composition or finished edit. Check the evidence status of each reference in EDIT-BRIEF.json: Instagram reels remain unreviewed; YouTube examples were sampled through storyboards and automatic captions, not full playback. Brand assets and actual footage must be reviewed before visual choices are finalized.\n`);
    writeFileSync(join(dest, 'INTAKE.md'), `# ${slug}\n\n` +
      `Preset: ${preset}. Copied ${inventory.length} local source file(s); originals are untouched.\n\n` +
      `1. Add any remaining media under assets/source/ and register each file with a unique id in EDIT-BRIEF.json.\n` +
      `2. Identify speakers and assets (Dennis, interviewer, guest, B-roll, logo). Mark uncertain identities as unresolved.\n` +
      `3. Choose local transcription, an existing word-level transcript or an authorized provider. No transcription has run.\n` +
      `4. Review the source and propose complete-story candidates with source_id, source_start_seconds, source_end_seconds, speaker_ids, hook, context, payoff and selection reason. These times are on the original source clock.\n` +
      `5. Apply reviewed cuts, keep an original-to-edit mapping, and build a HyperFrames composition using DESIGN.md. This scaffold does not include index.html.\n` +
      `6. Review the actual draft and audio; record evidence in VERIFY.md. Prepare platform copy, keeping the entire Threads caption under 500 characters.\n\n` +
      `This command only stages local files and writes a brief. It does not upload, transcribe, analyze, edit, render or publish media. See docs/MRBIZNTECH-WORKFLOW.md in the repository.\n`);
    return dest;
  } catch (error) {
    rmSync(dest, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.action === '--help') console.log(usage);
    else if (options.action === '--list') {
      for (const [key, preset] of Object.entries(profile.presets)) console.log(`${key}: ${preset.name}`);
    } else {
      createEditProject(options);
      console.log(`Created video-projects/${options.slug} with the ${options.preset} intake brief. Read INTAKE.md before editing.`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
