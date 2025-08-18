# Cleaned Action Tracker Datasets

Generated on: 2025-08-18T16:36:09.948421Z

## Outputs
- dim_actors.csv — one row per person with org + role
- dim_models.csv — unique models by (program, ata, variant)
- fact_actions.csv — unified actions across trackers
- fact_model_events.csv — time-stamped events per model
- fact_latest_by_model.csv — latest status snapshot per model
- link_action_model.csv — bridge between actions and models
- enums.json — canonical values for subject/status/milestone/priority

## Notes
- Owners are parsed as 'ORG - Person' where possible.
- Status, milestones and priorities are normalized to canonical enums.
- Dates are parsed into ISO timestamps when possible.
