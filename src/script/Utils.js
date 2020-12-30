import * as Edge from "../diagram/Edge"
import * as Point from "../diagram/Point"

export function getBounds(points) {
  var north = -90;
  var south = 90;
  var east = -180;
  var west = 180;
  for (var p of points) {
    north = Math.max(north, p.lat);
    south = Math.min(south, p.lat);
    east = Math.max(east, p.lng);
    west = Math.min(west, p.lng);
  }
  return {
    north: north,
    south: south,
    east: east,
    west: west,
  };
}

export function sumBounds(bounds){
  
  var north = -90;
  var south = 90;
  var east = -180;
  var west = 180;
  for (var b of bounds) {
    north = Math.max(north, b.north);
    south = Math.min(south, b.south);
    east = Math.max(east, b.east);
    west = Math.min(west, b.west);
  }
  return {
    north: north,
    south: south,
    east: east,
    west: west,
  };
}

export function getZoomProp(bounds, width, height, min_zoom = 0, anchor = undefined, margin = 50) {
  var center = {
    lat: (bounds.south + bounds.north) / 2,
    lng: (bounds.east + bounds.west) / 2
  };
  var zoom = Math.floor(Math.log2(Math.min(
    360 / (bounds.north - bounds.south) * width / 256 * Math.cos(center.lat * Math.PI / 180),
    360 / (bounds.east - bounds.west) * height / 256
  )));
  if (zoom < min_zoom) {
    zoom = min_zoom;
    if (anchor) {
      var max_lng = 360 * (width - margin * 2) / 256 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom);
      var max_lat = 360 * (height - margin * 2) / 256 / Math.pow(2, zoom);
      if (Math.abs(center.lng - anchor.lng) > max_lng / 2) {
        center.lng = anchor.lng + max_lng / 2 * (center.lng > anchor.lng ? 1 : -1);
      }
      if (Math.abs(center.lat - anchor.lat) > max_lat / 2) {
        center.lat = anchor.lat + max_lat / 2 * (center.lat > anchor.lat ? 1 : -1);
      }
    }
  }
  return [center, zoom];
}

export function findClosedIndex(point, points){
  const measure = (a, b) => {
    return Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2)
  }
  var index = -1
  var min = null
  points.forEach( (p, i) => {
    var d = measure(point, p)
    if ( !min || d < min ){
      min = d
      index = i
    }
  })
  return index
}

export function findClosedDist(e1, e2, p){
  var e = Edge.init(
    Point.init(e1.lng, e1.lat),
    Point.init(e2.lng, e2.lat)
  )
  p = Point.init(p.lng, p.lat)
  return Edge.getDistance(e, p)
}