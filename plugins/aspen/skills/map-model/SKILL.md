---
name: map-model
description: Use after downloading the instance's metadata, or when the index alone can't answer a question — fans out one subagent per component type (platform objects, custom layouts, and so on) to read the metadata in parallel and write a map of each type's shape, conventions, relationships, and extension points.
---

# Map the model

The digest at `.aspen/model/` says **what exists**. It cannot say what the model *means* — the
conventions this instance follows, what references what, where the real extension points are. That
takes reading, so fan it out: one subagent per component type, in parallel, each writing a map.

Run this **once per download**, not once per session. Maps survive a digest rebuild.

## When

- After the first `aspen move download-active-set` on a machine.
- After a download whose manifest shows types with `mapped: false`.
- When someone asks a question the index cannot answer — "how do layouts hang together here", "what
  does our object graph look like", "where would this field go".

Skip it for a question a grep answers. Mapping thousands of components is real token spend.

## Fan out

1. **Read the manifest.** `.aspen/model/manifest.json` lists every `(tier, type)` slice with a
   count, an inventory path, and `mapped` — false when no current map exists.
2. **Plan and say so.** List the slices you will map and their component counts. If the total is
   over ~2,000 components or more than 10 slices, tell the human what it will cost and let them
   narrow it before you spawn anything.
3. **Spawn one `aspen-component-mapper` per unmapped slice, all in one message** so they run in
   parallel. Give each exactly:
   - `tier` and `type`
   - `inventory` — the path from the manifest
   - `signature` — the signature from the manifest, to be copied into its output verbatim
   - `metadataRoot` — from the manifest
   Batch about six at a time on a large instance; more than that and the results get hard to read.
4. **Stitch.** When they return, write `.aspen/model/overview.md`: a paragraph per type, then the
   cross-type observations only visible from above — the object graph, conventions that hold across
   types, the contradictions between two mappers' findings. Contradictions are findings; resolve
   them by opening the source files, not by picking one.
5. **Rebuild the digest** so `index.md` shows the new maps:

   ```
   node "${CLAUDE_PLUGIN_ROOT}/hooks/model-digest.mjs" build
   ```

## Re-mapping

Each map carries the signature of the files it was built from. A rebuild recomputes signatures and
flips `mapped` to false for any slice whose files changed, so a re-map only redoes what moved.

Never edit a map by hand. Re-map the slice.

## Rules

- **Maps are a reading aid, not the model.** Author against the source file a map points to, never
  against the map. Mappers parse best-effort and can be wrong; the instance validates on checkin
  and is the only authority.
- **Mappers cannot run the CLI or reach the network.** They read files. If a slice needs metadata
  that was never downloaded, download it first and re-run.
- **One agent per type, never one per component.** Spawning an agent to transcribe a file is the
  expensive way to run `cat` — the digest already extracted the names.
