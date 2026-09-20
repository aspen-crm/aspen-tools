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
