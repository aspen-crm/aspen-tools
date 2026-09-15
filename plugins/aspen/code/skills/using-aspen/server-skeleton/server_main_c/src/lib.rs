//! Server codefile for the example instance.
//!
//! `entrypoints!` reads `aspen.server.json` and generates one trait per entry declared there.
//! `contact_logger_c` is the trigger declared for `contact_p`; implementing its `after_insert`
//! is the whole codefile.

use aspen_crm::error;
use aspen_crm::record::{FieldState, RecordFieldValue};
use aspen_crm::record::trigger::AfterInsertContext;

aspen_crm::entrypoints!(Entrypoints);

struct Entrypoints;

/// The contact's full name, which the platform derives from the name parts.
const FIELD_NAME: &str = "name_p";

/// Stands in for a name the insert did not carry, so the line is still readable.
const UNNAMED: &str = "(no name)";

impl contact_logger_c for Entrypoints {
    fn after_insert(context: &AfterInsertContext) -> error::Result<()> {
        for record in context.batch().iter() {
            let name = match record.get(FIELD_NAME)? {
                FieldState::Value(RecordFieldValue::Text(name)) => name,
                _ => UNNAMED.to_string(),
            };

            aspen_crm::info!(context, "contact created: {name}");
        }

        Ok(())
    }
}
