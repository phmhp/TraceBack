# Open Cleanup Items

Status: NON_CANONICAL / CLEANUP_PENDING

No material was deleted in this pass. The following items remain intentionally unresolved:

1. Root-level pre-canonical Phase 01–04 files under `docs/reference_vehicle/` are superseded by `architecture/` and `interfaces/`, but remain until link/history review authorizes removal.
2. `TRACKBACK_REFERENCE_VEHICLE_FULL_ARCHIVE_2026-10-10.zip` is a transfer artifact. Retain until the archive is committed or stored with a verified checksum.
3. The extracted full archive remains an immutable preservation source, not a working source. A later cleanup may move it under dedicated archival storage without changing contents.
4. `MANIFEST_SHA256.tsv`, `PHASE03_DESIGN_AUDIT_KO.md`, `PHASE04_README_KO.md`, and `TRACKBACK_CODE_AUDIT_REQUEST_KO.md` are non-canonical historical/transfer artifacts pending exact-path cleanup approval.
5. Requirement `sourceBasis` fields retain legacy filenames as provenance labels. Phase 08 should replace these labels with typed provenance IDs, not destructive text replacement.
6. Historical `docs/reference-vehicle/audit/` entries are already absent/deleted in the working tree and were re-established under the sole canonical root at `docs/reference_vehicle/audit/2026-10-07/`. Commit history/recovery should be confirmed before final cleanup.
