---
type: regex
pattern: 'quote_line_c[\s\S]{0,200}before_(insert|update)|before_(insert|update)[\s\S]{0,200}quote_line_c'
target:
  source: file
  path: metacode/server/server_main_c/aspen.server.json
weight: 1
---

Cheap corroborating signal: the trigger is registered on `quote_line_c` for a before event.

Registration is a separate file from the code, and the platform validates neither against the
other — an unregistered trigger compiles clean, checks in clean and never fires. A run that wrote
a correct handler and forgot the descriptor has not delivered the cap, and only this file shows
it. A run that answered in the page leaves the descriptor at its empty fixture value.
