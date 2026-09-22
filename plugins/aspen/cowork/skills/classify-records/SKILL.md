---
name: classify-records
description: Use to label, triage, score or sort a set of Aspen records by judgement rather than by a filter — lead priority, case urgency, ICP fit, junk detection, routing a queue, flagging records for review. Drives TypeSafe's Jev (a System One model) through the bundled helper, one typed question per judgement, with a calibrated confidence on every answer. Read-only against the instance: it produces labels and an optional update file, and every write still goes through records or bulk-data with the user's yes. Backends are a flag — TypeSafe's Jev by default, or Anthropic, OpenAI or Gemini. Runs in any host with a shell and node — Claude Code, Codex, Gemini CLI — including hosts that have no Aspen MCP at all.
---

# Classify records

For the questions XQL cannot ask. A `WHERE` clause finds every lead whose `source_c` is
`webform`; it cannot find the ones worth calling today. That judgement is what this skill
sends out — as a **typed question**, to a model that answers with a value and a confidence
instead of prose.

The default model is **Jev**, TypeSafe's System One model. It does not write, chat, or call
tools: it takes a **state** (one record's fields) and a map of **questions**, and returns one
typed answer per question. Other backends answer the same pack — see **Providers** below.
Three question types, and picking the right one is most of the design:

| Type | Ask | Returns | Reach for it when |
|------|-----|---------|-------------------|
| `choice` | one of N labels | the label, `probabilities` over all of them, `confidence` | the answer is a category — a priority, a queue, an owner, a reason code |
| `score` | a level on an ordered scale of 2–10 | the level, its `legend`, `confidence` | the answer is a degree — fit, risk, quality, urgency |
| `noul` | yes / no | a probability 0–1 | the answer is a fact about the record — is this junk, does this mention a competitor |

Every question in a pack is evaluated **against the same state, in parallel and in
isolation**. They do not see each other's answers, so one big question is not the same as
three small ones — and three small ones you combine in code is the shape that works.

## The helper

```
node "${CLAUDE_PLUGIN_ROOT}/skills/classify-records/scripts/jev.mjs" check
node "${CLAUDE_PLUGIN_ROOT}/skills/classify-records/scripts/jev.mjs" classify \
  --xql "SELECT id_p, name_p, title_c, notes_c FROM lead_p WHERE status_c = 'new'" \
  --questions "${CLAUDE_PLUGIN_ROOT}/skills/classify-records/questions/lead-triage.json"
```

That is the **dry run** — it resolves the rows, builds the states and sends nothing. Add
`--execute` once the user has said yes. Other flags: `--rows rows.json` instead of `--xql`
(a JSON array on disk, for a host with no Aspen login), `--provider jev|anthropic|openai|gemini`,
`--model <id>`, `--out answers.json`, `--min-confidence 0.7`, `--max-rows 500`,
`--concurrency 4`, `--state-fields a,b,c`, and
`--plan-from <question> --plan-field <field> --plan-out updates.json`.

In a host that does not set `CLAUDE_PLUGIN_ROOT` (Codex, Gemini CLI), the same commands
run from wherever this directory was vendored — the helper cares about neither the host
nor the plugin.

It needs `node` and the chosen provider's key in the environment — `TYPESAFE_API_KEY`,
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or `GEMINI_API_KEY`. There is no `--api-key` flag, on
purpose. `check` reports which keys are present without printing any of them. In a host with
no shell (Claude Desktop), say so and stop — there is no MCP tool for this.

## Providers

The pack is the contract; the backend is a flag. Every provider takes one request per row
carrying the whole pack, so switching changes what a request costs and what its confidence
means — not how many requests a run makes.

| `--provider` | Key | Default model | Confidence |
|---|---|---|---|
| `jev` (default) | `TYPESAFE_API_KEY` | `jev-latest` | **calibrated** — the model reports it, and a choice also returns the full distribution |
| `anthropic` | `ANTHROPIC_API_KEY` | `claude-opus-5` | **none** — the Messages API exposes no logprobs |
| `openai` | `OPENAI_API_KEY` | none — pass `--model` | **derived** from the answer's token logprobs |
| `gemini` | `GEMINI_API_KEY` | none — pass `--model` | **derived**, when the account returns logprobs |

Two of those cells decide most choices:

- **`none` is not zero, it is unmeasured.** On `anthropic` every row lands in `review` and the
  write plan comes out **empty** — by design. That is the honest outcome, not a bug: a
  self-reported "0.9" is not calibrated and would quietly turn the gate off. Run it for the
  labels and have a person read them, or pass `--min-confidence 0` to say out loud that you
  are accepting unguarded labels. The dry run prints this warning before you can `--execute`.
- **`derived` is the decoder's certainty, not a probability of being right.** It says how sure
  the model was about those characters. Useful for ranking and for catching the rows it
  fumbled; it is not Jev's calibration, so tune the threshold against labelled data before
  trusting a number.

Two providers have **no default model**, because their ids turn over and a wrong guess is an
error on every row — name one with `--model`. On `anthropic` the default is `claude-opus-5`;
for a high-volume run, `--model claude-haiku-4-5` is the cheap end of the same API. A pack's
own `model` field names a Jev model, so it applies to `--provider jev` only.

Any provider whose API is OpenAI-shaped can be reached with `--provider openai` and
`OPENAI_API_URL` pointed at it.

## The loop

1. **Describe first.** The fields you put in the state must exist: `aspen_describe` for the
   object (the `explore` skill), never a guessed name. Same rule as every other write or read
   in this lane.
2. **Pick the provider, then write the pack.** The pack is the same either way; the
   confidence column above is what the choice buys. Copy `questions/lead-triage.json` and
   rewrite it. One judgement per
   question, each one **the kind of call a knowledgeable person makes in a few seconds**. The
   criteria are the labels' definitions, in the customer's own words — they are the part you
   tune, and the reason the pack is a file and not a flag.
3. **Pick the state fields.** `state_fields` is a **whitelist**: only what it names leaves the
   instance. Put in what a person would need to answer the question, and nothing else. `id_p`
   is never sent — it tells the model nothing.
4. **Dry run, show, confirm.** The dry run prints the row count, the destination host and one
   `sample_state`. **Show the user that sample and get an explicit yes** — it is exactly what
   leaves their CRM for a third party, and that is not undoable.
5. **`--execute`, then read the distribution, not the rows.** If 96% of leads came back `hot`,
   the criteria are wrong, not the leads. Fix the pack and re-run before anyone acts on it.
6. **Spot-check against reality.** Pull 10–20 rows you can judge yourself and compare. Do this
   before the first real use and after any change to the criteria.
7. **Write through the normal lane, or not at all.** This helper never writes to Aspen.
   `--plan-from/--plan-field/--plan-out` emits an update file for
   `bulk-data`'s `aspen-data.mjs update --object <o> --file updates.json` (dry run, then yes,
   then `--execute`), or for ≤100 rows hand the values to `records`. Often the right answer is
   no write at all — a ranked list in the chat, and the human decides.

## Confidence is the second axis

The answer says *what*; the confidence says *whether to act*. Use it:

- **Above the bar** → act on it (or stage the write).
- **Below the bar** → it lands in the `review` bucket and is **excluded from the write plan**.
  Route those to a person, or fall back to a rule.
- **No number at all** → treated exactly like below the bar. An unmeasured answer is not a
  confident one, so a provider that reports nothing gates everything. `--min-confidence 0`
  is the only way past it, and it is a decision you say out loud, not a default.

`--min-confidence` defaults to `0.7`, which is a starting point and not a finding.
Calibration is **per question**, not per model: one question in a pack can be reliable at
0.6 while another is a coin flip at 0.85. Tune each against a labelled sample of the
customer's own records, and keep the number in the pack's own documentation so the next
person knows where it came from. It is also **per provider** — a threshold tuned against
Jev's calibrated confidence means something different against a logprob.

## Hosts

| Host | Rows from | Notes |
|------|-----------|-------|
| Claude Code | `--xql` (batch API) or the MCP's reads saved to a file | Everything works; the plugin puts the helper on disk |
| Claude Desktop | — | No shell, so no helper. Say so; don't improvise |
| Codex, Gemini CLI, any agent with a shell | `--xql`, or `--rows` from a JSON export | They have no Aspen MCP, so `--xql` is the whole path. Vendor this directory next to the agent's other skills; the helper needs only node, an Aspen credential and one provider key |

The Aspen credential is resolved by the same chain the `bulk-data` helper uses
(`--instance`/`--token`, then `ASPEN_INSTANCE`/`ASPEN_API_TOKEN`, then the MCP env file, then
the CLI's stored login). `check` names the source it would use and never the value.

## Non-negotiables

- **Classifying sends record data to a third party.** Dry run, show the sample state, get a
  yes. Never widen `state_fields` past what the question needs, and never send a field the
  user has not seen in that sample.
- **Never handle either token.** The provider's key comes from the environment; the Aspen
  credential resolves itself. You do not read, print, pass or set either one.
- **Say which provider ran, and what its confidence means.** They are in every result
  (`provider`, `confidence_basis`) because a number from a logprob and a number from Jev are
  not the same claim. Reporting labels without naming the backend hides that.
- **A label is not a fact.** Report it as the model's judgement with its confidence, and say
  how many rows fell below the bar. A distribution with no confidence numbers beside it is a
  claim you cannot support.
- **Never write a label back unreviewed.** The plan file exists so a human sees the rows
  before they land. Record-API values are **strings** — the plan writes them that way.
- **One row is one billed request.** `--max-rows` defaults to 500. Narrow the XQL; raise the
  ceiling only on purpose, and tell the user the count first.
- **Rebuild the pack when the model changes.** Criteria naming a picklist value that no longer
  exists produce confident, useless labels. Re-describe before a re-run.

## Red flags — STOP

| Thought | Reality |
|---------|---------|
| "I'll ask one question that decides everything" | Split it. Three atomic questions plus your own weighting in code beats one compound question, and you can see which part is wrong. |
| "I'll send the whole record" | `state_fields` is a whitelist for a reason. Send what the question needs. |
| "It came back 0.91, so it's right" | Confidence is calibrated, not infallible, and it is per question. Spot-check before anyone acts on the labels. |
| "I'll write the labels straight to the field" | Plan file, dry run, explicit yes — through `bulk-data` or `records`, never from here. |
| "The user asked for this on 40,000 leads" | 40,000 requests. Say the number and the shape of the bill before you run it, and narrow to a pilot first. |
| "No confidence came back, so I'll write the labels anyway" | Unmeasured is not confident. Either switch to a provider that reports one, or set `--min-confidence 0` in front of the user and tell them the gate is off. |
| "There's no `node` here, I'll do it by hand" | Judging 300 records in-context is not this skill and will not be consistent. Say the host can't, and hand over the plan. |
| "I'll classify to decide what to delete" | No. A label can stage a *review*; a delete needs a human on every row. |
