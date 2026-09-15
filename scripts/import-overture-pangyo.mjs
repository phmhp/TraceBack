import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { CatmullRomCurve3, Vector3 } from 'three'

const root = process.cwd()
const rawDir = path.join(root, 'src/data/imported/pangyo2/raw')
const outFile = path.join(root, 'src/data/maps/map-pangyo2.json')
const bbox = { west: 127.076, south: 37.398, east: 127.098, north: 37.415 }
const originLat = (bbox.south + bbox.north) / 2
const originLon = (bbox.west + bbox.east) / 2
const metersPerLat = 111_320
const metersPerLon = metersPerLat * Math.cos(originLat * Math.PI / 180)
const project = ([lon, lat]) => ({ x: (lon - originLon) * metersPerLon, y: 0, z: (lat - originLat) * metersPerLat })
const inside = ([lon, lat]) => lon >= bbox.west && lon <= bbox.east && lat >= bbox.south && lat <= bbox.north
const distance = (a, b) => Math.hypot(b.x - a.x, b.z - a.z)
const simplify = (points, tolerance = 2) => points.filter((point, index) => index === 0 || index === points.length - 1 || distance(points[index - 1], point) >= tolerance)
const widths = { motorway: 15, trunk: 14, primary: 13, secondary: 11, tertiary: 9, residential: 7, living_street: 6, service: 5.5, unclassified: 6 }
const profileFor = (roadClass) => roadClass === 'motorway' || roadClass === 'trunk' ? 'HIGHWAY_6_LANE' : roadClass === 'primary' || roadClass === 'secondary' ? 'URBAN_4_LANE' : roadClass === 'tertiary' ? 'MOUNTAIN_2_LANE' : 'RESIDENTIAL_2_LANE'
const read = (name) => JSON.parse(fs.readFileSync(path.join(rawDir, name), 'utf8'))
const segmentsRaw = read('pangyo2_segments.geojson')
const connectorsRaw = read('pangyo2_connectors.geojson')
const buildingsRaw = read('pangyo2_buildings.geojson')
const allowed = new Set(Object.keys(widths))

const roads = segmentsRaw.features.flatMap((feature, index) => {
  const props = feature.properties ?? {}; if (props.subtype !== 'road' || !allowed.has(props.class) || feature.geometry?.type !== 'LineString') return []
  const coordinates = feature.geometry.coordinates.filter(inside); if (coordinates.length < 2) return []
  const centerline = simplify(coordinates.map(project)); if (centerline.length < 2) return []
  return [{ id: feature.id ?? `road-${index}`, roadClass: props.class, profileId: profileFor(props.class), width: widths[props.class], centerline, sourceId: feature.id ?? null }]
})
roads.push(
  {id:'trackback-model-open-proving',roadClass:'unclassified',profileId:'OPEN_TEST_ROAD',width:7,centerline:[{x:-720,y:0,z:620},{x:-300,y:0,z:620}],sourceId:null},
  {id:'trackback-model-dirt-link',roadClass:'service',profileId:'DIRT_SINGLE_ROAD',width:4.5,centerline:[{x:430,y:0,z:650},{x:520,y:1.2,z:590},{x:610,y:2.1,z:500},{x:695.9966467486703,y:0,z:394.8631719998545}],sourceId:null},
)
const polygonArea = (points) => Math.abs(points.reduce((sum, point, index) => { const next = points[(index + 1) % points.length]; return sum + point.x * next.z - next.x * point.z }, 0) / 2)
const candidateBuildings = buildingsRaw.features.flatMap((feature, index) => {
  const geometry = feature.geometry; const rings = geometry?.type === 'Polygon' ? [geometry.coordinates[0]] : geometry?.type === 'MultiPolygon' ? geometry.coordinates.map((polygon) => polygon[0]) : []
  return rings.flatMap((ring, part) => {
    const footprint = simplify(ring.filter(inside).map(project), 1.2); if (footprint.length < 4 || polygonArea(footprint) < 35) return []
    const props = feature.properties ?? {}; const explicit = Number(props.height); const floors = Number(props.num_floors)
    const height = Number.isFinite(explicit) && explicit > 1 ? explicit : Number.isFinite(floors) && floors > 0 ? floors * 3.2 : 12
    const heightSource = Number.isFinite(explicit) && explicit > 1 ? 'OVERTURE_HEIGHT' : Number.isFinite(floors) && floors > 0 ? 'NUM_FLOORS_ESTIMATE' : 'TRACKBACK_FALLBACK'
    return [{ id: `${feature.id ?? `building-${index}`}-${part}`, footprint: footprint.slice(0, 48), height: Math.min(height, 80), heightSource, collider: true }]
  })
})
const pointSegmentDistance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;if(!l2)return distance(p,a);const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/l2));return Math.hypot(p.x-(a.x+t*dx),p.z-(a.z+t*dz))}
const pointInPolygon=(point,polygon)=>{let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if(((a.z>point.z)!==(b.z>point.z))&&(point.x<(b.x-a.x)*(point.z-a.z)/(b.z-a.z)+a.x))inside=!inside}return inside}
const overlapsRoadClearance=(building)=>roads.some((road)=>building.footprint.some((point)=>road.centerline.slice(1).some((end,i)=>pointSegmentDistance(point,road.centerline[i],end)<road.width/2+3.5))||road.centerline.some((point)=>pointInPolygon(point,building.footprint)))
const buildings = candidateBuildings.filter((building)=>!overlapsRoadClearance(building)).sort((a, b) => polygonArea(b.footprint) - polygonArea(a.footprint)).slice(0, 260)
const connectors = connectorsRaw.features.filter((feature) => feature.geometry?.type === 'Point' && inside(feature.geometry.coordinates)).map((feature, index) => ({ id: feature.id ?? `connector-${index}`, position: project(feature.geometry.coordinates) }))
const routeRoad = roads.filter((road) => ['secondary', 'tertiary', 'residential'].includes(road.roadClass)).sort((a, b) => b.centerline.reduce((n,p,i)=>n+(i?distance(b.centerline[i-1],p):0),0)-a.centerline.reduce((n,p,i)=>n+(i?distance(a.centerline[i-1],p):0),0))[0] ?? roads[0]
if (!routeRoad) throw new Error('No driveable Overture roads found in bbox')
const smoothRoute=(points)=>{if(points.length<3)return points;let controls=points;for(let pass=0;pass<4;pass++){const next=[controls[0]];for(let i=0;i<controls.length-1;i++){const a=controls[i],b=controls[i+1];next.push({x:a.x*.75+b.x*.25,y:a.y*.75+b.y*.25,z:a.z*.75+b.z*.25},{x:a.x*.25+b.x*.75,y:a.y*.25+b.y*.75,z:a.z*.25+b.z*.75})}next.push(controls.at(-1));controls=next}const curve=new CatmullRomCurve3(controls.map((p)=>new Vector3(p.x,p.y,p.z)),false,'centripetal',.3);return curve.getPoints(Math.max(controls.length*2,Math.ceil(curve.getLength()/4))).map(({x,y,z})=>({x,y,z}))}
const route = smoothRoute(routeRoad.centerline)
routeRoad.centerline=route
const heading = Math.atan2(route[1].x - route[0].x, route[1].z - route[0].z)
const releaseState = JSON.parse(fs.readFileSync(path.join(rawDir, 'pangyo2_segments.geojson.state'), 'utf8'))
const release = releaseState.last_release ?? 'unknown'
const world = { minX: -(bbox.east-originLon)*metersPerLon-30, maxX: (bbox.east-originLon)*metersPerLon+30, minZ: -(bbox.north-originLat)*metersPerLat-30, maxZ: (bbox.north-originLat)*metersPerLat+30 }
const output = {
  mapId: 'MAP_PANGYO2_OVERTURE_01', displayName: 'Pangyo 2nd Techno Valley', worldBounds: world, defaultSurfaceType: 'GRAVEL', capabilities: ['IMPORTED_OVERTURE','CURVE','INTERSECTION','HIGH_SPEED_AVAILABLE'],
  importedBaseMap: { metadata: { source: 'Overture Maps Foundation', bbox, originLat, originLon, overtureRelease: release, attribution: '© Overture Maps Foundation; source data includes OpenStreetMap (ODbL)' }, roads, connectors, buildings },
  spawnPoints: [{ id:'SPAWN_EGO_START', position:{...route[0],y:.9}, rotationY:heading, tags:['EGO','START'] }],
  routes: [{ routeId:'PANGYO_SAMPLE_ROUTE', orderedPoints:route, checkpoints:route.slice(1,-1).filter((_,i)=>i%Math.max(1,Math.floor(route.length/4))===0).map((_,i)=>({id:`CP_${i+1}`,pointIndex:Math.min(route.length-2,(i+1)*Math.max(1,Math.floor(route.length/4)))})), startPoint:route[0], startHeading:heading, finishPoint:route.at(-1), finishHeading:Math.atan2(route.at(-1).x-route.at(-2).x,route.at(-1).z-route.at(-2).z), closedLoop:false }],
  roadSegments: [], surfaceZones: [], environmentZones: [], staticObjects: [], actorSpawnPoints: [], scenarioTriggerZones: [], minimapConfig:{routeId:'PANGYO_SAMPLE_ROUTE',width:180,height:180,padding:18}
}
fs.writeFileSync(outFile, JSON.stringify(output, null, 2))
process.stdout.write(`Generated ${path.relative(root,outFile)}: ${roads.length} roads, ${connectors.length} connectors, ${buildings.length} buildings, route ${route.length} points\n`)
