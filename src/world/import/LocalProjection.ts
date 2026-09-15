export interface GeographicOrigin { originLat: number; originLon: number }
const METERS_PER_DEGREE_LATITUDE = 111_320
export function projectWgs84ToLocal(lon: number, lat: number, origin: GeographicOrigin) {
  const metersPerDegreeLongitude = METERS_PER_DEGREE_LATITUDE * Math.cos(origin.originLat * Math.PI / 180)
  return { x: (lon - origin.originLon) * metersPerDegreeLongitude, y: 0, z: (lat - origin.originLat) * METERS_PER_DEGREE_LATITUDE }
}
export function unprojectLocalToWgs84(x: number, z: number, origin: GeographicOrigin) {
  const metersPerDegreeLongitude = METERS_PER_DEGREE_LATITUDE * Math.cos(origin.originLat * Math.PI / 180)
  return { lon: origin.originLon + x / metersPerDegreeLongitude, lat: origin.originLat + z / METERS_PER_DEGREE_LATITUDE }
}
