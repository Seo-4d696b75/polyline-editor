import { MapContainer } from "../components/Map"
import { PolylineProps, EditPoint, LatLng, ExtendPoints } from "../script/types"


export function start(this: MapContainer, edit: EditPoint) {
  this.setState({
    ...this.state,
    edit_line: edit.line,
    edit_extend: {
      line: edit.line,
      index: edit.index,
      points: [edit.position],
    },
    edit_option: null,
    edit_points: [
      {
        position: edit.position,
        type: "extend",
        index: -1,
        line: edit.line,
      }
    ],
  })
}

export function update(this: MapContainer, event: any) {
  if (this.state.edit_extend && !this.state.edit_option) {
    this.state.edit_extend as ExtendPoints
    const pos = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    }
    var points = Array.from(this.state.edit_extend.points)
    points.push(pos)
    const component = this.new_line.current as any
    if (component) {
      var path = points.map(p => new this.props.google.maps.LatLng(p.lat, p.lng))
      if (component.polyline instanceof google.maps.Polyline) {
        component.polyline.setPath(path)
      } else {
        console.error("fail to find google.maps.Polyline in", component)
      }
    }
  }
}

export function addPoint(this: MapContainer, pos: LatLng) {
  if (this.state.edit_extend) {

    const extend = this.state.edit_extend as ExtendPoints
    extend.points.push(pos)
    this.setState({
      ...this.state,
      edit_extend: extend,
      edit_option: null,
      edit_points: [
        {
          position: pos,
          type: "extend",
          index: -1,
          line: extend.line,
        }
      ]
    })
  }
}

export function complete(this: MapContainer) {
  if (this.state.edit_extend) {
    this.state.edit_extend as ExtendPoints
    const points = this.state.edit_extend.points
    if (points.length > 1) {
      console.log("extend", points)
      points.shift()
      addPoints.call(this, points)
    }
  }
}

function addPoints(this: MapContainer, points: Array<LatLng>, lines?: Array<PolylineProps>) {
  if (this.state.edit_extend) {
    const extend = this.state.edit_extend as ExtendPoints
    const line = this.state.edit_extend.line
    points.forEach(p => {
      if (extend.index === 0) {
        line.points.splice(0, 0, p)
      } else {
        line.points.push(p)
      }
    })
    line.version += 1
    this.props.onUpdate(lines)

    this.setState({
      ...this.state,
      edit_line: null,
      edit_extend: null,
      edit_option: null,
      edit_points: [],
    })
  }
}

export function undoPoint(this: MapContainer) {
  if (this.state.edit_extend) {
    const extend = this.state.edit_extend
    const size = extend.points.length
    if (size > 1) {
      extend.points.splice(size - 1, 1)
      var pos = extend.points[size - 2]

      this.setState({
        ...this.state,
        edit_extend: extend,
        edit_points: [
          {
            position: pos,
            type: "extend",
            index: -1,
            line: extend.line,
          }
        ],
        edit_option: null,
      })

      const component = this.new_line.current as any
      if (component) {
        var path = extend.points.map(p => new this.props.google.maps.LatLng(p.lat, p.lng))
        if (component.polyline instanceof google.maps.Polyline){
          component.polyline.setPath(path)
        } else {
          console.error("fail to find google.maps.Polyline in", component)
        }
      }
    }
  }
}

export function merge(this: MapContainer, point: EditPoint) {
  if (this.state.edit_extend) {

    const points = this.state.edit_extend.points
    if (points.length > 1) {
      points.shift()
      const line2 = point.line
      var lines = this.props.polylines.filter(line => line.key !== line2.key)
      if (point.index === 0) {
        line2.points.forEach(p => points.push(p))
      } else if (point.index === line2.points.length - 1) {
        Array.from(line2.points).reverse().forEach(p => points.push(p))
      } else {
        return
      }
      console.log("merge", points, line2.points)
      addPoints.call(this, points, lines)

    }
  }
}