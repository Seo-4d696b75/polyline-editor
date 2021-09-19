import { type } from "os"

export interface LatLng {
  lat: number
  lng: number
}

export type Polyline = Array<LatLng>

export interface Bounds {
  east: number
  west: number
  south: number
  north: number
}

export interface ZoomProps {
  center: LatLng
  zoom: number
}

export interface PolylineProps {
  key: number
  version: number
  color: string
  stroke: boolean
  visible: boolean
  name: string
  setting: boolean
  points: Polyline
}

export interface PointSelector {
  position: LatLng
  line: PolylineProps
  index: number
  fillColor?: string
  key: number
  onClick?: (marker: google.maps.Marker, self: PointSelector) => void
  onDragStart?: (pos: LatLng, self: PointSelector) => void
  onDrag?: (pos: LatLng, self: PointSelector) => void
  onDragEnd?: (pos: LatLng, self: PointSelector) => void
}

export enum EditState {
  EdgeFocused,
  Extending
}

export interface EditPoint {
  position: LatLng
  index: number
  type: "extend-target" | "extend" | "exist" | "new" | "extend-from"
  line: PolylineProps
}

export interface ExtendPoints {
  index: number
  line: PolylineProps
  points: Array<LatLng>
}

export interface EditOption {
  point: PointSelector
  line: PolylineProps
  marker: google.maps.Marker
  type: "exist-terminal" | "exist-middle" | "extend-target" | "extend"
}
