# aspen-code eval suite

Behavioral evals for the `aspen-code` plugin, run with `claude plugin eval`. Each case is a
realistic builder request; the graders check the decisions and code the plugin's `using-aspen`
skill is meant to produce. Every case runs a with-plugin arm and a no-plugin baseline arm, so the
report shows the plugin's lift (the score delta), not just an absolute score.

The prompts hand the model the object shapes and field names it needs, so a case never turns on
whether the model guessed a schema. What the prompts deliberately withhold is the *technique* — how
to batch, how to surface a trigger failure, when a metadata layout beats a custom page, which design
tokens to reach for. That technique is exactly what the skill teaches, so it is what the delta
measures.

## Cases

| Case | Requirement it exercises |
| --- | --- |
| `trigger-notify-and-errors` | Author a record trigger that notifies a user, with failures surfaced — not swallowed |
| `bulk-crud-batching` | Batch reads and writes across the whole trigger batch; one round trip, not N |
| `metadata-layout-first` | Reach for a metadata layout/list view/tab before building any custom UI |
| `custom-ui-design-tokens` | When a custom page is genuinely needed, style it with the Aspen design tokens |
| `derived-value-in-model` | A budget figure becomes a stored field plus a trigger, not page arithmetic |
| `status-flow-is-lifecycle` | A stage order becomes `lifecycle_p`, not a hand-rolled transition check |
| `validation-not-in-page` | A save-time rule lands in a before-trigger, because every other write path bypasses the page |
| `reuse-platform-object` | "A deal object" is `opportunity_p`, which the instance already has |
| `no-cpq-graph` | A small quoting need stays two objects, not Salesforce's seven |
| `field-not-object` | A yes/no attribute is a checkbox, not a picklist and not an object |

Cases four to six are the `model-first` cases, and their prompts are deliberately **ambiguous
about the tier**. They are written the way the request actually arrives — naming the screen the person
imagines, or the page they already use — and never asking "should this be metadata or UI?". Two
of them go further and stack the deck the wrong way: `derived-value-in-model` ships a working UI
codefile in its fixture, and `validation-not-in-page` ships a quote editor with a `validateLine`
helper sitting one import from the page the prompt names. What the case measures is how quickly
the run reaches the right tier anyway.

The last three are the `lean-data-model` cases, and they are ambiguous in the other direction:
each is phrased as a request to **build something**, with no hint that the thing might already
exist or be too big. `reuse-platform-object` is not a constructed prompt at all — it is the
verbatim ask that produced a duplicate `deal_c` on a real 46-object instance, whose fields were
62% a rename of `opportunity_p`'s. The agent noticed the duplication and said so in its closing
summary, after building all six components. These cases measure whether the check happens first.

## Run it

The trigger cases author code and scaffold a starter crate, so they need the write tools granted
and `--scaffold` (both off by default):

```sh
cd plugins/aspen/code
claude plugin eval . \
  --allow-tools Read Glob Grep Bash Write Edit \
  --scaffold \
  --judge-model claude-sonnet-5 \
  --trust-plugin
```

The run needs an OS sandbox to confine the granted shell tool — on Linux, `bubblewrap` and `socat`
(`apt install bubblewrap socat`).

Useful flags: `--case '<glob>'` or `--tag <tag>` to run a subset, `--runs 1` for a quick pass,
`--ablation none` to skip the baseline arm, `--json results.json` / `--report report.html` to
capture output. Results land in `evals/results/` (gitignored).

## In CI

`.github/workflows/evals.yml` runs this suite and fails if any case scores below a threshold.
It makes real model calls, so it's manual (`workflow_dispatch` from the Actions tab), pins the
models, and archives `results.json` + `report.html` as artifacts. It needs an `ANTHROPIC_API_KEY`
repo secret. The fast, free unit tests in `test/` still run on every PR via `test.yml`.
