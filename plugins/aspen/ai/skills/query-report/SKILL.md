---
name: query-report
description: Use for a question about an Aspen object's records — a filtered or ranked list ("top 5 open opportunities by amount"), a count ("how many leads came in this week"), a total or average ("total pipeline", "average deal size"), or a group-by count/sum/average ("pipeline by stage", "cases per owner"). Writes AQL — including GROUP BY, HAVING and the COUNT/SUM/AVG/MIN/MAX aggregates — and runs it through /data/query and /data/count with execute_read_only_api_request. Also the AQL reference the other skills point to. Read-only.
---

# Query & report (AQL)

The hosted server has no natural-language planner and no report tool: **you write the AQL**.
Both endpoints are `safe`: send them through `execute_read_only_api_request`.

```
POST /api/v24.3/data/query   {"query": "SELECT … FROM … LIMIT n"}      → rows in body.data
POST /api/v24.3/data/count   {"query": "ROWCOUNT FROM … WHERE …"}      → body.count
```

**Describe first** (`explore`): every field you select, filter, group or sort on comes from the
object's describe. A wrong name is a `FAILURE` whose `detail` and `context.token` name it.

## The grammar, in one screen

```
SELECT projection, … FROM object [AS alias]
  [WHERE condition] [GROUP BY field, …] [HAVING aggregate-condition]
  [ORDER BY field|alias [ASC|DESC], …] LIMIT n [OFFSET m]

ROWCOUNT FROM object [WHERE condition]
```

- **`LIMIT` is required** on every `SELECT`, at most **1000**; `OFFSET` at most **10,000**, and
  it comes after `LIMIT`. Page over an `ORDER BY` that ends in `id_p`, so pages don't overlap.
- **The server cuts a response at 64 KB** (`truncated: true`, and `body` arrives as a cut-off
  string). That, not `LIMIT`, is what bounds a page: a few hundred narrow rows fit, far fewer
  with long text. Select only the fields you need and check `truncated` on every page.
- **Past 10,000 rows, slice with `WHERE`**, not `OFFSET` — date ranges on `ct_p`, say — and
  page each slice. `id_p` takes only `=`, `!=`, `IN`, `NOT IN` and `IS [NOT] NULL`, so it
  cannot be a range cursor.
- **Literals follow the field type.** Checkbox, number, percentage and currency values are
  unquoted (`= true`, `> 500`); every other type — text, date, datetime, id, picklist — is
  single-quoted (`= 'negotiation_c'`, `>= '2026-01-01'`). The wrong form is refused.
  Escape a quote as `\'`. An `IN (…)` list is all quoted or all unquoted.
- **Operators:** `= != < <= > >=`, `IN`, `NOT IN`, `IS NULL`, `IS NOT NULL`, `LIKE`, with
  `AND`, `OR` and parentheses.
- **`LIKE` takes a trailing wildcard only** — `'Bio%'` works, `'%Bio%'` is refused. A
  substring search is `/data/search`, not `LIKE`. Escape a literal `%` or `_` as `\%`, `\_`.
- **Sorting:** only fields describe marks **`sortable: true`** (indexed or unique) can be
  `ORDER BY` keys. An entered currency amount is not sortable — sort by its converted field
  (`amountcc_p`, the field's `converted-amt`).
- **Functions** (aliased in `SELECT`): `CURRENT_USER()` (only against a field that references
  `user_p`, with `=`/`!=`: `cb_p = CURRENT_USER()`, or through a `team_p` owner,
  `owner_p.user_p = CURRENT_USER()`), `TODAY()` against a date field, `NOW()`
  against a datetime field, `LABEL(field)` for a picklist item's label (also object-, field-,
  object-type-, lifecycle- and state-reference fields — **not a record lookup**; dot-walk to
  the lookup's display field instead), and `LONGTEXT(field)` for a long-text field's full
  content.
- **Joins:** dot-walk through lookups (`owner_p.user_p.username_p AS owner_user`, several hops
  deep); through a polyid use the arrow, `owner_p->user_p.username_p AS owner`. Describe tells you
  which: `type: polyid` needs the arrow, `id`/`lookup` doesn't. Alias every joined field —
  output names must be unique. A parent cannot reach its children; query the child.
- `WHERE`, `GROUP BY` and `HAVING` cannot use a `SELECT` alias; `ORDER BY` can.
- Picklist values in a `WHERE` are item **names**, not labels.

## Answering a question

1. **Pick the object and fields** from describe. If you don't know the object, `/data/search`.
2. **Say what you will run** in plain words — the filters, grouping and sort — so the user can
   see your reading of the question.
3. **Run it**, check `body.status`, and present the rows with labels (`LABEL(...)` or the
   picklist's item labels), not raw item names.
4. **Say how complete it is.** If the answer is a bounded page ("top 5"), say so. A total,
   average or count comes from an aggregate over every matching row — never from adding up a
   page.

## Counting

`ROWCOUNT FROM lead_p WHERE ct_p >= '2026-10-01'` on `/data/count` answers `body.count`. It is
its own verb on its own endpoint: `/data/query` refuses `ROWCOUNT`, and `/data/count` refuses
`SELECT`. Use it to size a job before reading anything.

**`ROWCOUNT` is exact only up to 10,000.** Past that it answers `10000` with
`has_more_rows: true` — "more than 10,000", not a count. For the exact number, or a count
alongside other numbers, use `COUNT(*)` in a `SELECT` (below).

## Totals and averages — aggregates without GROUP BY

A `SELECT` whose projections are **all aggregates** returns exactly one row computed over every
row the `WHERE` matches — no paging, whatever the table size:

```
SELECT COUNT(*) AS n, SUM(amountcc_p) AS pipeline, AVG(amountcc_p) AS avg_deal,
       MAX(close_date_p) AS latest_close
FROM opportunity_p WHERE status_p = 'open_p' LIMIT 1
```

| Aggregate | Takes | Returns |
|---|---|---|
| `COUNT(*)` | — | the number of rows |
| `COUNT(field)` | a field of any type | the rows where it is not null |
| `SUM`, `AVG` | number, percentage, **converted** currency | a number |
| `MIN`, `MAX` | number, percentage, converted currency, date, datetime, time | the field's own type |

- **An entered currency amount is refused** by every aggregate but `COUNT`
  (`AGGREGATE_ARGUMENT_TYPE`). Aggregate its converted field — the entered field's
  `converted-amt` in describe (`amount_p` → `amountcc_p`) — which is in the instance's system
  currency. Say which currency the total is in.
- `MIN`/`MAX` of a text field is refused; `COUNT(field)` counts its non-null values.
- Nulls are ignored. Over no rows, `COUNT` is `0` and the others are null — report "no
  matching records", not zero.
- The argument may dot-walk through a lookup or polyid like any field. Aggregates are not
  allowed in `WHERE`; that is what `HAVING` is for.

## Group-by reports

```
SELECT status_p, COUNT(*) AS n, SUM(amountcc_p) AS pipeline
FROM opportunity_p WHERE close_date_p >= '2026-01-01'
GROUP BY status_p ORDER BY pipeline DESC LIMIT 100
```

- **Every projection is a grouping key or an aggregate.** Anything else is refused
  (`PROJECTION_NOT_GROUPED`), and so is **`LABEL(...)`** (`GROUPED_FUNCTION_PROJECTION`).
  Select the key, then map picklist item names to labels from the picklist describe.
- **Keys** are field paths, through a lookup or a polyid arrow
  (`owner_p->user_p.username_p`), or a record's display-name field (`ownerdn_p`). Several keys
  give one row per combination. Long text can't be a key, and a key is listed once.
- **Rows with no value form their own group**, returned as null — call it "(none)". Text keys
  group case-insensitively (`'Acme'` and `'acme'` are one group).
- **There is no date bucketing.** A date key groups by day; a datetime key by the instant. For
  "by month", run one aggregate query per month range and say so.
- **`ORDER BY`** takes grouping keys and aggregate aliases (`ORDER BY n DESC` for the biggest
  groups). A **picklist, object-type, lifecycle or state key cannot be sorted**
  (`ORDER_BY_LABEL_IN_GROUPED_QUERY`) — order by an aggregate, or sort the rows yourself.
- **`HAVING` filters groups**, `WHERE` filters rows before grouping:
  - its left side is an aggregate call, **repeated — never its alias**: `HAVING COUNT(*) > 5`,
    not `HAVING n > 5` (`ALIAS_OUT_OF_SCOPE`);
  - its right side is a literal: unquoted for `COUNT`, `SUM` and `AVG`; for `MIN`/`MAX`, the
    field's own form (`HAVING MAX(close_date_p) >= '2027-01-01'`);
  - `= != < <= > >=`, `IN`, `NOT IN`, `IS [NOT] NULL`, `AND`, `OR`, parentheses — no `LIKE`, no
    `TODAY()`/`NOW()`;
  - without `GROUP BY` it filters the single all-rows group: one row or none.
- Grouped rows page with `LIMIT`/`OFFSET` like any others. Totals over groups you didn't fetch
  are not totals — page until `body.data` is shorter than the limit, or ask for the overall
  number with an ungrouped aggregate.

**An older instance may refuse `GROUP BY` or the aggregates.** Fall back in this order and say
which you used: a `ROWCOUNT` per picklist value for a count by a picklist (exact, one call per
value), or page the matching rows and aggregate them yourself — exact only if you read every
page.

## Numbers

Every value comes back as a **string** — amounts, counts, aggregates, checkboxes (`"50000.00"`,
`"284"`, `"true"`). Parse before you add, compare or format. `AVG` returns many decimal places;
round for display.

**Currency:** the entered amount (`amount_p`) is in the record's own currency, named by its
currency lookup (`ccode_p` → a `currency_p` record). Select `ccode_p.currency_code_p` for the
code's picklist name (`usd_p`) and show its label (`USD`) — never assume a currency. The
converted amount (`amountcc_p`) is in the system currency, which is what aggregates and
sorting use.

## Red flags

| Thought | Reality |
|---|---|
| "I'll page through and add up the amounts" | One `SELECT SUM(…), COUNT(*) … LIMIT 1` gives the exact total. |
| "`SUM(amount_p)`" | Refused for an entered currency. `SUM(amountcc_p)` — the converted field. |
| "`ORDER BY amount_p`" | Not sortable. `ORDER BY amountcc_p`; check `sortable` in describe. |
| "`LIMIT 5000` will fetch everything" | `LIMIT` stops at 1000, and 64 KB cuts the page first. Narrow the fields, check `truncated`. |
| "`OFFSET 20000`" | `OFFSET` stops at 10,000. Slice the set with `WHERE` and page each slice. |
| "`WHERE is_won_c = 'true'`" | Checkbox is unquoted: `= true`. |
| "`WHERE amount_c = '500'`" | Number is unquoted: `= 500`. |
| "`LIKE '%acme%'`" | Trailing wildcard only. Use `/data/search` for a substring. |
| "`SELECT LABEL(stage_c), COUNT(*) …`" | Refused in a grouped query. Select `stage_c` and map labels. |
| "`HAVING n > 5`" | `HAVING` can't see aliases. Repeat the aggregate: `HAVING COUNT(*) > 5`. |
| "`GROUP BY stage_c ORDER BY stage_c`" | A picklist key can't be sorted in a grouped query. Order by an aggregate. |
| "`owner_p.username_p`" | If `owner_p` is a polyid, it's `owner_p->user_p.username_p`. On some objects it points at `team_p`, not `user_p`. Describe. |
| "`LABEL(customer_p)` for the account name" | `LABEL` is for picklists. Dot-walk: `customer_p->account_p.name_p`, or the display field `customerdn_p`. |
| "`ROWCOUNT` said 10000" | With `has_more_rows: true` that means "more than 10,000". `COUNT(*)` gives the exact number. |
| "`ROWCOUNT` on `/data/query`" | Refused there. `ROWCOUNT` goes to `/data/count`; `/data/query` takes `SELECT` only. |
| "No rows, so the answer is zero" | Check `body.status` — a `FAILURE` is not an empty result. |
