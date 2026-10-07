---
name: query-report
description: Use for a question about an Aspen object's records — a filtered or ranked list ("top 5 open opportunities by amount"), a count ("how many leads came in this week"), or a group-by count/sum/average ("pipeline by stage", "cases per owner"). Writes AQL and runs it through /data/query and /data/count with execute_api_request. Also the AQL reference the other skills point to. Read-only.
---

# Query & report (AQL)

The hosted server has no natural-language planner and no report tool: **you write the AQL**.
Both endpoints are `safe` and run without an approval prompt.

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

- **`LIMIT` is required** on every `SELECT`, and a response holds **at most 100 rows**. Page
  with `LIMIT 100 OFFSET 100`, `OFFSET 200`, … over an `ORDER BY` that ends in `id_p`, so
  pages don't overlap. `OFFSET` comes after `LIMIT`.
- **Literals follow the field type.** Checkbox, number, percentage and currency values are
  unquoted (`= true`, `> 500`); every other type — text, date, datetime, id, picklist — is
  single-quoted (`= 'negotiation_c'`, `>= '2026-01-01'`). The wrong form is refused.
  Escape a quote as `\'`. An `IN (…)` list is all quoted or all unquoted.
- **Operators:** `= != < <= > >=`, `IN`, `NOT IN`, `IS NULL`, `IS NOT NULL`, `LIKE`, with
  `AND`, `OR` and parentheses.
- **`LIKE` takes a trailing wildcard only** — `'Bio%'` works, `'%Bio%'` is refused. A
  substring search is `/data/search`, not `LIKE`. Escape a literal `%` or `_` as `\%`, `\_`.
- **Functions** (aliased in `SELECT`): `CURRENT_USER()` (only against a user-reference field,
  with `=`/`!=`: `owner_p = CURRENT_USER()`), `TODAY()` against a date field, `NOW()` against a
  datetime field, `LABEL(field)` for a picklist or reference's display label, and
  `LONGTEXT(field)` for a long-text field's full content.
- **Joins:** dot-walk lookups up to two hops (`customer_p.owner_p.username_p AS owner`);
  through a polyid use the arrow, `what_p->account_p.name_p AS account`. Alias every joined
  field — output names must be unique. A parent cannot reach its children; query the child.
- `WHERE` and `GROUP BY` cannot use a `SELECT` alias; `ORDER BY` can.
- Picklist values in a `WHERE` are item **names**, not labels.

## Answering a question

1. **Pick the object and fields** from describe. If you don't know the object, `/data/search`.
2. **Say what you will run** in plain words — the filters and the sort — so the user can see
   your reading of the question.
3. **Run it**, check `body.status`, and present the rows with labels (`LABEL(...)` or the
   picklist's item labels), not raw item names.
4. **Say how complete it is.** If the answer is a bounded page ("top 5"), say so. If you need
   every matching row, page to the end — never total or rank from the first 100.

## Counting

`ROWCOUNT FROM lead_p WHERE ct_p >= '2026-10-01'` on `/data/count` counts at flat cost for any
table size. It is its own verb on its own endpoint: `/data/query` refuses `ROWCOUNT`, and
`/data/count` refuses `SELECT`. Use it to size a job before reading anything.

## Group-by reports

```
SELECT stage_c, COUNT(*) AS n, SUM(amount_c) AS pipeline
FROM opportunity_c WHERE is_closed_c = false
GROUP BY stage_c ORDER BY pipeline DESC LIMIT 50
```

- Aggregates: `COUNT(*)`, `COUNT(field)`, `SUM`, `AVG`, `MIN`, `MAX`. Every projection must be
  a grouping key or an aggregate — **`LABEL(...)` is refused in a grouped query.** Select the
  key, then map picklist item names to labels from the picklist describe.
- Keys may be reached through a lookup (`owner_p.username_p`). Long-text fields can't be keys.
  Rows with no value form their own group, returned as null — call it "(none)".
- `ORDER BY` takes grouping keys or aggregate aliases (`ORDER BY n DESC` for the biggest
  groups). A **picklist, object-type or lifecycle key cannot be sorted** — order by an
  aggregate instead, or sort the groups yourself.
- `HAVING COUNT(*) > 5` filters groups after aggregation; `WHERE` filters rows before.
- Grouped rows page with `LIMIT`/`OFFSET` like any others. Totals over groups you didn't fetch
  are not totals — page until `body.data` is shorter than the limit.

**An older instance may refuse `GROUP BY`.** Fall back in this order and say which you used:
a `ROWCOUNT` per picklist value for a count by a picklist (exact, one call per value), or page
the matching rows and aggregate them yourself — exact only if you read every page.

## Numbers

Amounts, counts and checkboxes come back as **strings** (`"50000.00"`, `"true"`). Parse before
you add, compare or format. A currency field's code is a picklist name (`usd_p`) — format with
its label (`USD`), and never assume a currency.

## Red flags

| Thought | Reality |
|---|---|
| "`LIMIT 5000` will fetch everything" | 100 rows per response. Page with `OFFSET`. |
| "The sum of the first page is the total" | Only if `body.data` was shorter than the limit. Page, or aggregate in AQL. |
| "`WHERE is_won_c = 'true'`" | Checkbox is unquoted: `= true`. |
| "`WHERE amount_c = '500'`" | Number is unquoted: `= 500`. |
| "`LIKE '%acme%'`" | Trailing wildcard only. Use `/data/search` for a substring. |
| "`SELECT LABEL(stage_c), COUNT(*) …`" | Refused in a grouped query. Select `stage_c` and map labels. |
| "`ROWCOUNT` on `/data/query`" | Refused there. `ROWCOUNT` goes to `/data/count`; `/data/query` takes `SELECT` only. |
| "No rows, so the answer is zero" | Check `body.status` — a `FAILURE` is not an empty result. |
