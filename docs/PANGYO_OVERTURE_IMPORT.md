# Pangyo 2nd Techno Valley Overture Import

## Architecture

The map keeps two layers. `importedBaseMap` contains projected Overture roads, connectors, building footprints, height provenance, and source metadata. Existing TRACKBACK routes, spawns, checkpoints, actors, triggers, and minimap configuration remain the gameplay overlay. Simulation, DriverInput, VehiclePhysics, and the fixed-step runtime are unchanged.

The game reads only `src/data/maps/map-pangyo2.json`. It does not call Overture or another map API at runtime.

## Source and preprocessing

- Import bbox: west `127.076`, south `37.398`, east `127.098`, north `37.415`.
- Local origin: bbox centre.
- Projection: local equirectangular metres (`x = longitude`, `z = latitude`) around the origin.
- Raw inputs: Overture `transportation/segment`, `transportation/connector`, and `buildings/building` GeoJSON.
- Road filtering: road subtype plus TRACKBACK-supported motorway, trunk, primary, secondary, tertiary, residential, living-street, service, and unclassified classes.
- Road width: `TRACKBACK_MODEL` class profile in the import script. It is a game parameter, not a claim of surveyed width.
- Geometry: lines are clipped to the test bbox, simplified, and emitted as a continuous ribbon per Overture centerline. Intersections overlap without endpoint gaps.
- Buildings: minimum footprint area and vertex caps are applied. Height precedence is Overture height, floor-count estimate, then TRACKBACK fallback. Only buildings near the race route receive approximate Rapier AABB colliders.

Run `node scripts/import-overture-pangyo.mjs` after replacing the raw GeoJSON files. The generated map records the Overture release/source version found in the input.

## Attribution

Map geometry is derived from © Overture Maps Foundation data. The downloaded features include OpenStreetMap source records licensed under ODbL 1.0. The game applies original TRACKBACK low-poly materials and does not reproduce real building façades.
