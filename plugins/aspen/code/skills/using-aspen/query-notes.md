# Query notes (XQL and the data API)

Read this before writing a query — from a page (`@aspen-crm/sdk/request` against the instance's
data endpoints) or from a trigger (`context.services().query()`, see `rust-trigger-notes.md`).
Both speak the same XQL. Everything below was confirmed on a real instance (platform 26.3.3),
each by hitting it. The limits are the platform's, not one instance's data.

## Syntax and limits

- **One line.** A newline truncates the query after line 1 — the rest is silently dropped, and
  any error is about the fragment that survived.
- **`LIMIT` is mandatory** and maxes at **1000** (`LIMIT 2000` → `MAX_VALUE_FAILURE`). A query
  returns at most **100 rows** regardless. A fetch-everything design therefore has a hard
  ceiling; never use one for anything that grows.
- **`LIMIT n OFFSET m`** pages. `SKIP` does not exist ("Unexpected content after query").
- Checkbox and number values in `WHERE` are unquoted (`is_active_c = true`); ids and text are
  quoted.
- `IN ('id1','id2',...)` works. Chunk a computed id set at 100 and fire the chunks in parallel
  (`Promise.all`), never a serial `for await` loop.
- `WHERE` takes `OR`, parentheses and dot-walked predicates together:
  `employee_p.user_p = CURRENT_USER() AND (follows_p = true OR contact_p.owner_p = CURRENT_USER())`.
- **`CURRENT_USER()` works** and resolves server-side. Use it instead of fetching `/auth/me` and
  interpolating the id — that is a round trip that gates everything behind it. It is absent from
  the `ac` validator binary's `strings` output; that says nothing about the server.
- Batch writes take at most 100 records per request.

## Dot-walking

- Works to **two hops** in `SELECT` (`contact_p.primary_account_p.name_p` returns the account's
  name, not its id) and in `ORDER BY` — which is what makes `OFFSET` paging stable.
- **Many-to-one only**, through a lookup field. A parent cannot reach its children: `contact_p`
  has no path to `contact_rel_p` ("Invalid field 'contact_rel_p' in object 'contact_p'"), because
  one contact has many relationship rows. Query the child (join) object and dot-walk up instead.
- **Response keys are the leaf field name only**, so `contact_p.name_p` and
  `contact_p.primary_account_p.name_p` collide. Alias with `AS`. Without it the query fails
  cleanly ("Output field names in query must be unique") rather than losing data.

## Counting

- **`/data/count` is a separate endpoint with its own verb, `ROWCOUNT`** — not `SELECT COUNT()`.
  `ROWCOUNT FROM contact_p WHERE owner_p = CURRENT_USER()` returns
  `{"count":18,"has_more_rows":false}` at flat cost for any table size. `/data/query` rejects
  `ROWCOUNT` and `/data/count` rejects `SELECT`; the error names both ("Query must start with
  'SELECT' or 'ROWCOUNT'").
- Native list views get their "of 151" this way. They do not fetch all rows to count, and neither
  should a custom page.

## Cost model

**Per-request overhead dominates; row count barely matters.** One `/data/query` costs about the
same whether it returns 25 rows or 500. Optimise by cutting round trips and running the ones you
keep in parallel — never by trimming columns or rows. A native list-view tab spends most of its
cold-load calls on `describe/*` metadata (cached after the first load); a custom page skips those,
so it starts ahead and loses only by making more data round trips than it needs.

The shape that wins, for a paged table:

1. On load, in parallel: the `ROWCOUNT`(s) the header needs, and one
   `SELECT … LIMIT <page> OFFSET 0`.
2. On a page turn: one `SELECT … LIMIT <page> OFFSET <n>`, nothing else.

A few calls on load, one per page, flat at any table size.

## Pattern: "records related to me"

Query the **join object** — it holds both the link and the join's own fields — filter it on the
current user, dot-walk the parent's detail off its lookup, count with `ROWCOUNT`, page with
`LIMIT/OFFSET`. Going the other way, from the parent down to its joins, is impossible (see
dot-walking). The shape, shown wrapped but sent as one line:

```
SELECT contact_p.name_p AS contact_name, contact_p.primary_account_p.name_p AS account_name
FROM contact_rel_p WHERE employee_p.user_p = CURRENT_USER()
ORDER BY contact_p.name_p LIMIT 25 OFFSET 0
```
