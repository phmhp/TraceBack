# Phase 4 Final Map Foundation Stabilization

## 1. Collision root cause

The original imported renderer created visual building extrusion without a matching physics definition. The first collider pass then used broad footprint AABBs and allowed one to cover the ego spawn. `MapLoader` now creates colliders only for `collidable` static objects, route-near imported buildings, route slope surfaces, and highway guardrails. Route clearance excludes any collider that would cover the drive corridor. Rapier debug rendering is available through `physicsDebugOptions.showColliders`.

## 2. Road/building overlap

The overlap came from rendering Overture road and building features independently. The import script now evaluates each building footprint against every road centerline using the profile width plus a 3.5 m shoulder/safety margin. Intersecting buildings are filtered during preprocessing rather than moved by map-specific coordinates.

## 3. Start/finish data

`RouteDefinition` supports `startPoint`, `startHeading`, `finishPoint`, `finishHeading`, and indexed checkpoints. World start/finish markings and minimap markers read this route data.

## 4. Road profiles and lanes

`RoadProfileRegistry` owns lane count, lane width, shoulder width, median, edge/centre marking, and sidewalk configuration. The Pangyo map uses residential two-lane, urban four-lane, highway six-lane, and mountain two-lane profiles. TRACKBACK model overlays also define an open proving road and dirt single road.

## 5. Elevation and corner smoothing

Route points retain X/Y/Z and the non-race dirt test road contains a gentle elevation profile. The active race route stays on one continuous ground contact plane until a continuous terrain/road collider replaces the rejected segmented-ramp prototype. Imported route polylines receive four corner-cutting passes and are then sampled through a centripetal Catmull-Rom curve. The current route's maximum adjacent heading change is about 8.4 degrees. Connector-derived round junction surfaces close intersection gaps and provide usable turning space.

## 6. Vehicle speed

The temporary adapter still maps accelerator to speed-dependent drive force, pedal release removes drive force so damping/rolling resistance slow the car, and brake maps to brake force. Existing real-Rapier tests cover acceleration, release/pause behaviour, and full braking. Powertrain/VMC modelling remains out of scope.

## 7. Shadow

The shadow camera used to remain near the world origin, so the ego left its frustum. `VehicleShadowLight` follows the presentation pose and keeps a bounded 48 m near-environment shadow region. The broad fill light no longer spends a second shadow map on distant scenery.

## 8. Urban and roadside presentation

Imported road profiles generate sidewalks, shoulders, multiple lane markings, and highway medians. Connector-derived presentation places crosswalk and traffic-light visuals. Highway and mountain profiles add guardrail and near-environment vegetation. Traffic lights contain no state machine and remain separate from simulation logic.

## 9. Architecture boundary

Map import, road/building rendering, route markers, environment assets, camera, and lighting remain presentation/world concerns. Keyboard → DriverInput → SimpleVehicleControlAdapter → VehiclePhysics → Rapier is unchanged. No VMC, CAN, Fault, Requirement, Verification, audio, UI, or effect calls were introduced into physics. Future domain events can feed a presentation effect layer without reverse dependencies.

## 10. Remaining status

No critical Map/Physics architecture issue is known that blocks the next Vehicle Software phase. Further building art, vegetation variety, traffic signal behaviour, and terrain polish are intentionally deferred.
