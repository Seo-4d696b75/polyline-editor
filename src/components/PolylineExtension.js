export function start(edit) {
  this.setState(Object.assign({}, this.state, {
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
    ]
  }))
}

export function update(event){
  if (this.state.edit_extend && !this.state.edit_option) {
    const pos = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    }
    var path = Array.from(this.state.edit_extend.points)
    path.push(pos)
    const component = this.new_line.current
    if (component) {
      path = path.map(p => new this.props.google.maps.LatLng(p.lat, p.lng))
      component.polyline.setPath(path)
    }
  }
}

export function addPoint(event){
  if (this.state.edit_extend) {

    const pos = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    }
    const extend = this.state.edit_extend
    extend.points.push(pos)
    this.setState(Object.assign({}, this.state, {
      edit_extend: extend,
      edit_points: [
        {
          position: pos,
          type: "extend",
          index: -1,
          line: extend.line,
        }
      ]
    }))
  }
}

export function complete() {
  const extend = this.state.edit_extend
  const line = this.state.edit_extend.line
  const points = this.state.edit_extend.points
  if (points.length > 1) {
    points.shift()
    console.log("extend", line.name)
    points.forEach(p => {
      if (extend.index === 0) {
        line.points.splice(0, 0, p)
      } else {
        line.points.push(p)
      }
    })
    line.version += 1
    this.props.onUpdate()
  }
  
  this.setState(Object.assign({}, this.state, {
    edit_line: null,
    edit_extend: null,
    edit_option: null,
    edit_points: [],
  }))
}

export function undoPoint(){
  
  const extend = this.state.edit_extend
  const size = extend.points.length
  if ( size > 1 ){
    extend.points.splice(size-1, 1)
    var pos = extend.points[size-2]
    
    this.setState(Object.assign({}, this.state, {
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
    }))
    
    const component = this.new_line.current
    if (component) {
      var path = extend.points.map(p => new this.props.google.maps.LatLng(p.lat, p.lng))
      component.polyline.setPath(path)
    }
  }
}