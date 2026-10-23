# TRACKBACK V2 repository guidance

## Independence boundary

- This directory is a standalone deliverable. Never import files with `../` paths that escape this project.
- Assets, runtime modules, schemas, and source claims needed at runtime must live inside this directory.
- Legacy TRACKBACK is a reference only. Port a small, reviewed unit instead of linking to its source tree.

## Product direction

- Before gameplay, investigation, evidence, repair, re-drive, reward, or episode progression work, read `docs/TRACKBACK_GAMIFICATION_REDESIGN_v1.md`.
- Preserve the vehicle investigation and verification loop: drive → incident → evidence → hypothesis → test → report → repair → regression → re-drive.
- Each investigation scene has one question, one primary decision, and one primary CTA.
- Reveal vehicle architecture from the active incident path: Domain → Function → Logic → Trace. Do not show the whole registry by default.
- Keep engineering verdict, evidence sufficiency, and driving score separate.
- Label field frequency, owner-manual facts, runtime facts, and simulation assumptions.
- Do not copy third-party character design, assets, or visual identity.

## Fidelity rule

- Do not replace the Rapier/C/WASM vehicle simulation with a toy simulation in the production path.
- Progressive disclosure may change when information appears, but it must not delete the underlying evidence, requirement, architecture, test, or provenance depth.
- A guided investigation must require interpretation or comparison. Page visits and repeated Next clicks are not evidence acquisition.

## Case order

Use `docs/CASE_ROADMAP.md` as the current case priority. Public roadside-breakdown frequency is a prioritization proxy, not a claim about every region, vehicle, or validation organization.

