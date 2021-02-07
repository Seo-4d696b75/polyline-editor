
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
  point: EditPoint
  line: PolylineProps
  marker: google.maps.Marker
  type: "terminal" | "middle" | "extend-target" | "extend"
}

export interface MapState {
	edit_points: Array<EditPoint>
	edit_line: PolylineProps | null
	edit_option: EditOption | null
	edit_extend: ExtendPoints | null
}