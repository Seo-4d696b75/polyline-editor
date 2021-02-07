import * as edge from "../diagram/Edge"
import * as point from "../diagram/Point"
import {Polyline, Bounds, LatLng, ZoomProps} from "./types"

export function getBounds(points: Polyline): Bounds{
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

export function sumBounds(bounds: Array<Bounds>): Bounds{
  
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

export function getZoomProp(bounds: Bounds, width: number, height: number, min_zoom: number = 0, anchor: LatLng | null = null, margin: number = 50): ZoomProps {
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
  return {
    center: center,
    zoom: zoom
  };
}

export function findClosedIndex(point: LatLng, points: Polyline): number{
  const measure = (a: LatLng, b: LatLng) => {
    return Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2)
  }
  var index = -1
  var min = 100000000.0
  points.forEach( (p, i) => {
    var d = measure(point, p)
    if ( !min || d < min ){
      min = d
      index = i
    }
  })
  return index
}

export function findClosedDist(e1: LatLng, e2: LatLng, p: LatLng): number{
  var e = edge.init(
    point.init(e1.lng, e1.lat),
    point.init(e2.lng, e2.lat)
  )
  var pt = point.init(p.lng, p.lat)
  return edge.getDistance(e, pt)
}