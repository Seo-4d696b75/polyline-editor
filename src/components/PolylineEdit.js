import * as Utils from "../script/utils"

export function updateMarkers(line,event){
  
  if (this.state.edit_option) return
  const pos = {
    lat: event.latLng.lat(),
    lng: event.latLng.lng()
  };
  if (!line || line.points.length < 2) return
  var i1 = Utils.findClosedIndex(pos, line.points)
  var p1 = line.points[i1]
  var i2 = null
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
  var p2 = line.points[i2]
  if (this.state.edit_points.length === 3 &&
    this.state.edit_points[0].index === i1 &&
    this.state.edit_points[2].index === i2) return
  var points = []
  var dist = Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2))
  var zoom = this.map.getZoom()
  dist *= Math.pow(2, zoom)
  // no prompt marker shown if too narrow 
  if (dist > 40) {
    points = [
      {
        position: p1,
        type: "exist",
        index: i1,
        line: line,
      },
      {
        position: {
          lat: (p1.lat + p2.lat) / 2,
          lng: (p1.lng + p2.lng) / 2,
        },
        type: "new",
        index: Math.max(i1, i2),
        line: line,
      },
      {
        position: p2,
        type: "exist",
        index: i2,
        line: line,
      },
    ]
  }
  this.setState(Object.assign({}, this.state, {
    edit_points: points,
    edit_line: line,
  }))
}

export function closeMarkers(){
  this.setState(Object.assign({}, this.state, {
    edit_points: [],
  }))
}

export function updateNewLine(edit, pos){

  const line = edit.line
  var path = []
  if (edit.type === "new") {
    path.push(line.points[edit.index - 1])
    path.push(pos)
    path.push(line.points[edit.index])
  } else if (edit.type === "exist") {
    if (edit.index > 1) path.push(line.points[edit.index - 1])
    path.push(pos)
    if (edit.index < line.points.length - 1) path.push(line.points[edit.index + 1])
  }
  /*  not working because setState forces the marker to its original position, and prevents from being dragged
  this.setState(Object.assign({}, this.state, {
    new_line: path,
  }))
  solution: update path points of polyline directly without setState
  */
  const component = this.new_line.current
  if (component) {
    path = path.map(p => new this.props.google.maps.LatLng(p.lat, p.lng))
    component.polyline.setPath(path)
  }
}

export function updatePosition(edit, pos){
  
  const line = edit.line
  if (edit.type === "exist") {
    line.points[edit.index] = pos
  } else if (edit.type === "new") {
    line.points.splice(edit.index, 0, pos)
  }
  line.version += 1
  this.setState(Object.assign({}, this.state, {
    edit_line: null,
  }))
  this.props.onUpdate()
}

export function showOption(edit, marker){
  if (edit.type === "exist") {
    var terminal = (edit.index === 0 || edit.index === edit.line.points.length - 1)
    this.setState(Object.assign({}, this.state, {
      edit_option: {
        point: edit,
        line: edit.line,
        marker: marker,
        type: (terminal ? "terminal" : "middle"),
      },
      edit_points: [edit],
    }))
  } else if (edit.type === "extend") {
    this.setState(Object.assign({}, this.state, {
      edit_option: {
        point: edit,
        line: edit.line,
        marker: marker,
        type: "extend",
      },
    }))
  }
}

export function cutPolyline(option){

  const line = option.line
  const name = line.name
  const points = line.points
  const point = option.point
  if (point.index === 0 || point.index === points.length - 1) return
  var new_line = this.props.onAdd()
  var lines = this.props.polylines.map(l => {
    if (l.key === line.key) {
      line.name = `${name}-1`
      line.points = points.filter((p, i) => i <= point.index)
      new_line.name = `${name}-2`
      new_line.points = points.filter((p, i) => i >= point.index)
      return [line, new_line]
    } else {
      return l
    }
  }).flat()
  console.log("cut", name, `index:${point.index}`)
  this.props.onUpdate(lines)
  this.closeEditOption()
}

export function deletePoint(option){
  
  const line = option.line
  const point = option.point
  console.log("delete", line.name, `index:${point.index}`)
  line.points = line.points.filter((p, i) => i !== point.index)
  line.version += 1
  this.props.onUpdate()
  this.closeEditOption()
}