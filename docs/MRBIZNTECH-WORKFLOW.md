# MrBizNTech editing baseline

This fork will support Dennis Campbell's interviews, real-world footage and
podcasts across YouTube, Instagram Reels, TikTok, Threads and Facebook. Most
incoming footage may have Dennis off camera. The first customization is a local
intake command and project-specific editing profiles, not an upload website or
an unattended editing/publishing service.

## Start a private edit workspace

Node 22+ is sufficient for this intake command; no npm install, API key or network
connection is required. Source paths containing spaces must be quoted.

```sh
npm run new-edit -- --list
npm run new-edit -- community-story --preset off-camera --source "raw-media/event.mov"
npm run new-edit -- podcast-highlights --preset podcast --source "raw-media/episode.mp4"
npm run new-edit -- podcast-episode --preset podcast-full --source "raw-media/episode.mp4"
```

Repeat `--source` to stage multiple videos, audio files or images. Originals stay
untouched. Files are copied into a new, ignored `video-projects/<slug>/` folder;
large podcast files need enough free disk space for the copy. Existing projects
are never overwritten. Omit `--source` to prepare the brief before media arrives.
New projects remain local; the command never sends files to a service or GitHub.

Read the generated `INTAKE.md`, `EDIT-BRIEF.json` and `DESIGN.md`. Register later
media in the brief's `sources` list. Confirm speaker identities, source roles and
brand assets before editing. No transcription or clip analysis has occurred at
this stage. Rendering later requires the dependencies in the upstream setup.

| Preset | Starting behavior |
| --- | --- |
| `off-camera` (default) | Authentic scene footage and voice carry the story. No face panel or required return to camera. |
| `podcast` | Find standalone insights, preserve question/context and identify the actual speakers. |
| `podcast-full` | Preserve discussion and appropriate original framing; light cleanup and verified chapters. |
| `direct` | On-camera insight with restrained punch-ins and emphasis. |

The duration ranges in the profiles are editorial targets, not platform limits
or a reason to cut a thought short. Current platform upload requirements must be
checked when building the actual export/publishing integration.

## Baseline direction

- Confident, conversational leadership; make technical ideas human and concrete.
- Start with a supported tension, question or insight. Show the evidence and
  finish the thought. A hook does not justify changing what someone meant.
- Captions start at 2–5 words per readable phrase, sentence case, high contrast
  and restrained emphasis. Adjust after reviewing Dennis's first draft.
- Supplied footage, real demonstrations and screen recordings come first.
  Useful text/diagrams can carry missing visuals. No blanket cut-every-second
  rule, invented face camera, or requirement that every shot have artificial motion.
- Keep speech natural, emotional pauses intact and guest attribution clear.
  Reframing should preserve relevant people and action. Audio-only sources need
  an honest audio-led layout, not fabricated talking-head video.
- Visual branding is provisional until supplied assets are reviewed. Replace
  AIS example branding with Dennis's materials; preserve upstream license notices.

## Reference evidence

The three user-supplied Instagram reels are recorded in
`config/mrbizntech-editing.json` without share-tracking parameters:

- https://www.instagram.com/reel/DXJzl3jySxZ/
- https://www.instagram.com/reel/DfqJOLWI5p0/
- https://www.instagram.com/reel/DfTSZcnovSg/

The Instagram pages could not be retrieved during baseline setup. No claim about their creator,
fonts, cuts, layout or performance has been verified. Review accessible copies
before attributing specific style rules to them. They do not block first-footage
editing using this provisional baseline.

The later YouTube links were reviewed using metadata, automatic captions and
sampled storyboards. See [the reference analysis](REFERENCE-BASELINE.md) for
observed layouts, narrative patterns and verification limits. All three are
Alex Hormozi examples. Their problem/clarification/reframe structure can inform
podcast highlights, with optional speaker views or split-screen when suitable
footage exists. Exact transitions and audio were not verified through playback.

[Gary Vaynerchuk's own explanation](https://garyvaynerchuk.com/content-marketing-strategy/)
supports the pillar-to-microcontent approach: use a substantive recording as the
source for smaller, platform-specific pieces. That is the strategy inspiration
here. These presets are our starting editorial choices, not a measured replica
of Gary's visual style and not a promise of virality.

## Podcast selection and timing

Keep one untouched source as the original clock. Propose candidates using this
record shape; populate it only after reading and watching the actual source:

```json
{
  "source_id": "source-001",
  "source_start_seconds": 0,
  "source_end_seconds": 0,
  "speaker_ids": [],
  "hook": "",
  "context": "",
  "payoff": "",
  "selection_reason": ""
}
```

The zeros above are placeholders, not a valid approved segment. Confirm that
start/end are within the source, end is after start, the speaker is correct and
the idea is complete. Keep needed qualifications and the question when it
changes the answer's meaning. Choose the number of highlights from source
quality rather than a quota or an uncalibrated viral score.

After selecting a source range, keep all silence/mistake edits on their own
retimed clock with an original-to-edit mapping. Never run source timestamps
against cleaned footage. Use the upstream transcription and cut tools in
[WORKFLOW.md](WORKFLOW.md), then build a composition according to DESIGN.md and
the relevant rendering skills. The intake scaffold intentionally has no
index.html and cannot render until an actual composition is built.

## Delivery and review

Prepare a clean master and appropriate platform variants; verify crops, text
placement, captions and encoded audio using the actual footage. Titles, chapter
times, copy and claims must be supported by the source. Keep the entire Threads
caption under 500 characters, including spaces, hashtags and emoji. Credit guest
speakers correctly and do not manufacture a spoken CTA. Review the draft before
publishing; publishing integrations are future work.

Next implementation: upload/ingest interface, job persistence, chosen transcript
provider, source-aware candidate selection, reviewed rendering and export
bundles. They are not implemented by this baseline PR.
