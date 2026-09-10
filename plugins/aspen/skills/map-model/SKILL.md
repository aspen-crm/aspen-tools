---
name: map-model
description: Use after downloading the instance's metadata, or when the index alone can't answer a question — fans out one subagent per component type (objects, layouts, picklists, and so on) to read the metadata in parallel and write a map of each type's shape, conventions, relationships, and extension points.
---

# Map the model

The digest at `.aspen-model/` says **what exists**. It cannot say what the model
*means* — the conventions this instance follows, what references what, where the real
extension points are. That takes reading, so fan it out: one subagent per component
type, in parallel, each writing a map.

Run this **once per download**, not once per session. Maps survive a rebuild.

## When

- After the first download on a machine.
- After a download whose index shows types with no map, or a map marked `(stale)`.
- When someone asks a question the index cannot answer — "how do layouts hang together
  here", "what does our object graph look like", "where would this field go".

Skip it for a question a grep answers. Mapping thousands of components is real token
spend.

## Fan out

1. **Read `.aspen-model/index.md`.** Its component-type table lists every type, its
   component count, its inventory path, and whether a map exists or has gone stale.
2. **Read `.aspen-model/digest.json`** for `signatures` — one per ctype. Each mapper
   copies its own into its output verbatim; that is how the next rebuild knows whether
   the map still matches its sources.
3. **Plan and say so.** List the types you will map and their counts. Over ~2,000
   components or more than 10 types, tell the human what it will cost and let them
   narrow it before you spawn anything.
4. **Spawn one `aspen-component-mapper` per unmapped or stale type, all in one message**
   so they run in parallel. Give each exactly its `ctype`, its `inventory` path, and its
   `signature`. Batch about six at a time on a large instance; beyond that the results
   get hard to read.
5. **Stitch.** When they return, write `.aspen-model/maps/overview.md`: a paragraph per
   type, then the cross-type observations only visible from above — the object graph,
   conventions that hold across types, contradictions between two mappers. Contradictions
   are findings; resolve them by opening the source files, not by picking one.
6. **Rebuild** so the index reflects the new maps:

   ```
   node "${CLAUDE_PLUGIN_ROOT}/hooks/model-digest.mjs" build
   ```

## Re-mapping

Each map carries the signature of the files it was built from. A rebuild recomputes
signatures per type and marks a map `(stale)` when its sources moved, so a re-map only
redoes what changed. Edit one object file and the layouts map stays current.

Never edit a map by hand. Re-map the type.

## Rules

- **Maps are a reading aid, not the model.** Author against the source file a map points
  to, never against the map. Mappers parse best-effort and can be wrong; the instance
  validates on checkin and is the only authority.
- **Mappers cannot run the CLI or reach the network.** They read files. If a type needs
  metadata that was never downloaded, download it first and re-run.
- **One agent per type, never one per component.** Spawning an agent to transcribe a
  file is the expensive way to run `cat` — the digest already extracted the names.
