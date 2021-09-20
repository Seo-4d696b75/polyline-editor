import * as Utils from "../script/utils"
import { PolylineProps, LatLng, EditOption, PointSelector, EditState, EditType } from "../script/types"
import { MapContainer } from "../components/Map"
import * as Action from "../script/Actions"

export function updateSelectors(this: MapContainer, line: PolylineProps, pos: LatLng) {

  if (this.state.edit_option) return
  if (!line || line.points.length < 2) return
  // index of closest point
  var i1 = Utils.findClosedIndex(pos, line.points)
  var p1 = line.points[i1]
  switch (this.state.edit_state?.type) {
    case EditType.Extending:

      // TODO
      break
    case EditType.EdgeFocused:
    case undefined:
      var i2: number = 0
      if (i1 === 0) {
        i2 = 1
      } else if (i1 === line.points.length - 1) {
        i2 = line.points.length - 2
      } else {
        var d1 = Utils.findClosedDist(
          p1,
          line.points[i1 - 1],
          pos
        )
        var d2 = Utils.findClosedDist(
          p1,
          line.points[i1 + 1],
          pos
        )
        i2 = (d1 < d2) ? i1 - 1 : i1 + 1
      }
      // index of next point
      var p2 = line.points[i2]
      if (this.state.edit_state?.type === EditType.EdgeFocused) {
        var value = this.state.edit_state.value
        if (value.start.index === i1 && value.end.index === i2) {
          // no change
          break
        }
      }
      var points: Array<PointSelector> = []
      var dist = Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2))
      var zoom = this.map ? this.map.getZoom() : 1
      dist *= Math.pow(2, zoom)
      // no prompt marker shown if too narrow 
      if (dist > 40) {
        const click = (marker: google.maps.Marker, self: PointSelector) => {
          showEditOption.call(this, self, "exist", marker)
        }
        var i = Math.max(i1, i2)
        var start = {
          position: p1,
          index: i1,
          key: i1,
          line: line,
          onDragStart: (p: LatLng) => { updateEditingLine.call(this, line, i1, p, "exist") },
          onDrag: (p: LatLng) => { updateEditingLine.call(this, line, i1, p, "exist") },
          onDragEnd: (p: LatLng) => { updatePosition.call(this, line, i1, p, "exist") },
          onClick: click
        }
        var middle = {
          position: {
            lat: (p1.lat + p2.lat) / 2,
            lng: (p1.lng + p2.lng) / 2,
          },
          index: i,
          key: (i1 + i2) / 2,
          line: line,
          fillColor: "#FFFFFF",
          onDragStart: (p: LatLng) => { updateEditingLine.call(this, line, i, p, "new") },
          onDrag: (p: LatLng) => { updateEditingLine.call(this, line, i, p, "new") },
          onDragEnd: (p: LatLng) => { updatePosition.call(this, line, i, p, "new") },
        }
        var end = {
          position: p2,
          index: i2,
          key: i2,
          line: line,
          onDragStart: (p: LatLng) => { updateEditingLine.call(this, line, i2, p, "exist") },
          onDrag: (p: LatLng) => { updateEditingLine.call(this, line, i2, p, "exist") },
          onDragEnd: (p: LatLng) => { updatePosition.call(this, line, i2, p, "exist") },
          onClick: click
        }

        this.setState({
          ...this.state,
          edit_state: {
            type: EditType.EdgeFocused,
            value: {
              start: start,
              middle: middle,
              end: end
            }
          }
        })
      }
      break
    default:
  }
}

function updateEditingLine(this: MapContainer, line: PolylineProps, index: number, pos: LatLng, type: "new" | "exist") {

  var points: Array<LatLng> = []
  if (type === "new") {
    points.push(line.points[index - 1])
    points.push(pos)
    points.push(line.points[index])
  } else if (type === "exist") {
    if (index > 0) points.push(line.points[index - 1])
    points.push(pos)
    if (index < line.points.length - 1) points.push(line.points[index + 1])
  }
  /*  not working because setState forces the marker to its original position, and prevents from being dragged
  this.setState(Object.assign({}, this.state, {
    new_line: path,
  }))
  solution: update path points of polyline directly without setState
  */
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

export function updatePosition(this: MapContainer, line: PolylineProps, index: number, pos: LatLng, type: "new" | "exist") {

  if (type === "exist") {
    line.points[index] = pos
  } else if (type === "new") {
    line.points.splice(index, 0, pos)
  }
  line.version += 1
  Action.updateLines()
}

function showEditOption(this: MapContainer, selector: PointSelector, type: "exist" | "extend", marker: google.maps.Marker) {
  const line = selector.line
  const index = selector.index
  if (type === "exist") {
    var terminal = (index === 0 || index === line.points.length - 1)
    this.setState({
      ...this.state,
      edit_option: {
        point: selector,
        line: line,
        marker: marker,
        type: (terminal ? "exist-terminal" : "exist-middle"),
      },
    })
  } else if (type === "extend") {
    this.setState({
      ...this.state,
      edit_option: {
        point: selector,
        line: selector.line,
        marker: marker,
        type: "extend",
      },
    })
  } else if (type === "extend-target") {
    // TODO
  }
}

export function cutPolyline(this: MapContainer, option: EditOption) {

  const line = option.line
  const name = line.name
  const points = line.points
  const point = option.point
  if (point.index === 0 || point.index === points.length - 1) return

  console.log("cut", name, `index:${point.index}`)
  Action.updateLines((polylines, factory) => {
    var new_line = factory()
    return polylines.map(l => {
      if (l.key === line.key) {
        line.name = `${name}-1`
        line.version += 1
        line.points = points.filter((p, i) => i <= point.index)
        new_line.name = `${name}-2`
        new_line.points = points.filter((p, i) => i >= point.index)
        return [line, new_line]
      } else {
        return l
      }
    }).flat()
  })
  this.closeEditOption()
}

export function deletePoint(this: MapContainer, option: EditOption) {

  const line = option.line
  const point = option.point
  console.log("delete", line.name, `index:${point.index}`)
  line.points = line.points.filter((p, i) => i !== point.index)
  line.version += 1
  Action.updateLines()
  this.closeEditOption()
}

export function startExtending(this: MapContainer, selector: PointSelector) {
  this.setState({
    ...this.state,
    edit_state: {
      type: EditType.Extending,
      value: {
        point: {
          position: selector.position,
          line: selector.line,
          index: selector.index,
          key: selector.key,
          onClick: (marker, self) => { showEditOption.call(this, self, "extend", marker) }
        }
      }
    },
    edit_option: null,
  })
}

export function updateExtendingPoint(this: MapContainer, pos: LatLng) {
  if (this.state.edit_state?.type === EditType.Extending && !this.state.edit_option) {
    var points = [this.state.edit_state.value.point.position, pos]
    points.push(pos)
    const component = this.new_line.current
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

export function addPointExtending(this: MapContainer, pos: LatLng) {
  if (this.state.edit_state?.type === EditType.Extending && !this.state.edit_option) {
    const selector = this.state.edit_state.value.point
    const index = selector.index
    const line = selector.line
    var next_index = 0
    if (index === 0) {
      line.points.splice(0, 0, pos)
    } else if (index === line.points.length - 1) {
      next_index = line.points.length
      line.points.push(pos)
    } else {
      console.error("invalid index:", index, "adding a point to line:", line)
    }
    line.version += 1
    Action.updateLines()
    this.setState({
      ...this.state,
      edit_state: {
        type: EditType.Extending,
        value: {
          point: {
            position: pos,
            index: next_index,
            line: line,
            key: next_index,
            onClick: (marker, self) => { showEditOption.call(this, self, "extend", marker) }
          }
        }
      },
      edit_option: null,
    })
  }
}

export function completeExtending(this: MapContainer) {
  this.setState({
    ...this.state,
    edit_state: null,
  })
  this.closeEditOption()
}

export function deletePointExtending(this: MapContainer) {
  if (this.state.edit_state?.type === EditType.Extending) {
    const selector = this.state.edit_state.value.point
    const line = selector.line
    if (line.points.length <= 2) return
    const index = selector.index
    var next_index = 0
    if (index === 0) {
      line.points.splice(0, 1)
    } else if (index === line.points.length - 1) {
      line.points.splice(line.points.length - 1, 1)
      next_index = line.points.length - 1
    } else {
      console.error("invalid index:", index, "deleting a point from line:", line)
    }
    line.version += 1
    Action.updateLines()
    this.setState({
      ...this.state,
      edit_state: {
        type: EditType.Extending,
        value: {
          point: {
            position: line.points[next_index],
            index: next_index,
            line: line,
            key: next_index,
            onClick: (marker, self) => { showEditOption.call(this, self, "extend", marker) }
          }
        }
      },
      edit_option: null,
    })
  }
}


export function mergeLine(this: MapContainer, self: PointSelector, target: PointSelector) {
  if (this.state.edit_state?.type === EditType.Extending) {

    const points = self.line.points
    if (points.length > 1) {
      const line2 = target.line
      var lines = this.props.polylines.filter(line => line.key !== line2.key)
      if (self.index === 0) {
        if (target.index === 0) {
          line2.points.forEach(p => points.splice(0, 0, p))
        } else if (target.index === line2.points.length - 1) {
          line2.points.reverse()
          line2.points.forEach(p => points.splice(0, 0, p))
        }
      } else if (self.index === points.length - 1) {
        if (target.index === 0) {
          line2.points.forEach(p => points.push(p))
        } else if (target.index === line2.points.length - 1) {
          line2.points.reverse()
          line2.points.forEach(p => points.push(p))
        }
      }
      Action.updateLines(lines)
    }
  }
}