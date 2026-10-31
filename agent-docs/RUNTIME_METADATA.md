# Runtime metadata

Launchers supply nonsecret deployment context separately from SuperNinja's SaaS-owned `sandbox_metadata.json` and `ph_metadata.json`:

- `/dev/shm/runtime_metadata.json`: active tmpfs snapshot.
- `/root/.runtime_metadata.json`: durable snapshot, on a persistent volume when restart recovery is required.

Both paths use mode `0644`. Run the launcher as root so newly written files are root-owned. Do not store tokens, passwords, credentials or sign-in links here; token delivery remains unchanged.

## Document

A flat JSON object, for example:

```json
{
  "version": 1,
  "written_at": "2026-10-28T00:00:00Z",
  "machine_management": "admin_console",
  "admin_ui_url": "https://admin.example.com",
  "admin_owner_id": "UADMIN123",
  "messaging_channel": "slack",
  "workspace_id": "TWORKSPACE123"
}
```

`version` must be integer `1` (not a boolean). `written_at` must be an ISO8601 date-time with a timezone (`Z` or an offset); the writer stamps UTC when absent. Unknown nonsecret scalar fields and unrecognized capability/provider strings are preserved; consumers ignore values they do not recognize. Admin URL and contact are optional: omit unavailable values rather than passing empty strings or null. `admin_ui_url`, when present, must be a credential-free HTTPS URL. `admin_owner_id` must be a nonempty string.

Managed classification requires the explicit capability `machine_management="admin_console"`; admin contact/URL fields alone do not assert machine management. The capability still gives managed teardown guidance when neither contact field exists. `messaging_channel` and `workspace_id` scope the contact. Slack uses the workspace ID and a Slack member ID; Teams uses the Entra tenant ID (not a Teams team ID) and a hyphenated Entra object UUID. The launcher must obtain these values from verified control-plane configuration, not user text. Hosted sandbox context keeps its main-UI Pause link when runtime metadata supplies admin contact fields without that capability.

ninja-in-a-box also supplies `sandbox_provider="ninja-in-a-box"`, optional `litellm_selected_model`, and optional IANA `user_timezone` here without creating sandbox metadata. Existing sandbox context retains precedence for provider detection and model selection; the existing sandbox-file paths remain authoritative for model polling and bootstrap timezone when present. Runtime metadata is an additive path for deployments without that sandbox context. The sandbox/ph loaders, caching, durable fallback, field values and files are not migrated, filtered or rewritten. Admin guidance still reads only runtime metadata. Managed messaging scope supports `slack` and `teams`.

After tmpfs loss, provider detection restores existing durable sandbox context before model polling or bootstrap timezone chooses its source, so the first read retains sandbox precedence too.

The shared polling monitor initializes project `settings.json` through the same initializer as the orchestrator before reading messages. This also runs while background work is paused, so an existing-repo boot sync that deletes project settings cannot prevent the monitor from answering or receiving a resume request. It uses the existing Claude auth settings (or the durable project settings fallback) and normal sandbox/runtime model precedence; missing or invalid auth sources fail startup. Initialization does not enable the orchestrator or put credentials into runtime metadata.

Unknown nonsecret scalar fields are retained for future producers/consumers; nested objects/arrays and nonfinite numbers are invalid. Top-level names ending in `_token`, `_key`, `_secret`, or containing `password` (case-insensitive) are dropped with warnings by both the reader and writer. Filtering is a guardrail, not permission to submit other secrets.

## Shared writer and readers

All producers must use the shared standard-library writer before installers or consumer units start:

```sh
printf '%s\n' '{"machine_management":"admin_console","admin_ui_url":"https://admin.example.com","admin_owner_id":"UADMIN123","messaging_channel":"slack","workspace_id":"TWORKSPACE123"}' \
  | PYTHONPATH=/workspace/ninja python3 -m core.metadata write-runtime
PYTHONPATH=/workspace/ninja python3 -m core.metadata get runtime admin_ui_url
```

During ninja-in-a-box pre-install boot, set `PYTHONPATH` to the selected staged source root (`/opt/ninja-upstream` or `/opt/ninja-upstream-teams`), where `core/metadata.py` and `constants.py` already exist; `/workspace/ninja` may not yet be populated. Python and the source tree are sufficient; this module adds no third-party dependency. The CLI also accepts `get sandbox <key>` and `get ph <key>`. A missing key prints an empty line; invalid stdin or failed writes exit nonzero with an error on stderr.

Python APIs in `core.metadata`:

- `load_runtime_metadata() -> dict`: cached complete snapshot; `{}` if neither copy is valid/readable, no environment fallback.
- `get_admin_ui_url() -> str`, `get_admin_owner_id() -> str`: value or `""` if absent.
- `write_runtime_metadata(doc: dict) -> None`: validates before changing either file, stamps missing version/time, replaces both files, and refreshes this process's `runtime_metadata` cache.
- `refresh_config("runtime_metadata")` from `core.config`: explicit invalidation in another reader process. There is no live-update daemon.

The writer replaces snapshots rather than merging them: a removed key is gone on the next launch. Each file uses a same-directory temporary file, flush/fsync, mode `0644`, and atomic rename; failure cleans temporary files and reports an error. The two independent renames cannot form a cross-filesystem transaction. If the second replacement fails, the active copy can be newer than the durable one; the launcher must treat that write as failed before starting consumers and rewrite the complete snapshot.

The runtime loader composes the existing durable-fallback helper through runtime-only validation. A valid tmpfs snapshot wins in full, with no per-field merge. Invalid JSON, schema, version, timestamp, types or URL in tmpfs falls back to valid durable state and restores a validated `0644` tmpfs copy. Missing/invalid durable state returns `{}`. The sandbox/ph loaders and fallback helper retain their existing behavior.

## Restart behavior and producer responsibility

| Event | Result |
| --- | --- |
| Unit restart, crash, daemon reload | Files remain; values stay the same. |
| Pod/instance restart with launcher | Launcher replaces both snapshots before consumers; new values win. |
| Restart without launcher, including SN Stop/Resume | Loader restores the last valid durable snapshot after tmpfs loss. |
| Plain pod with no durable volume | No durable recovery guarantee; launcher must rewrite on restart. |

SuperNinja backend provisioning must write the same runtime document to both paths through this API. Resume should rewrite it as well so owner/configuration changes while stopped are not stale. That backend work and live-cluster restart/Stop/Resume verification are upstream responsibilities, not implemented by this Phantom change.

## Pause safety

The pause-work guidance helper reads admin capability/contact/URL/provider/scope only from runtime metadata. Affirmative hosted project/thread state comes separately from the read-only sandbox loader; sandbox admin fields never fill missing runtime fields. Requester matching still requires a scoped, proven human identity from the originating message. Only that verified admin sees a private console URL; another verified human in the same scope receives a common `<@ID>` mention. Unknown, cross-tenant, unproven, bot and app senders get neither. Admin identity is navigation/contact context, not console authorization; VPN, sign-in, admin permission and separate irreversible-teardown warnings remain required. Any security-sensitive action must confirm current control-plane authorization rather than trust a potentially stale launch owner.

No sandbox/ph metadata writes, token/auth changes, systemd changes, environment aliases or compatibility admin fallbacks are part of this contract.
