import { GoogleApiWrapper, Map, Marker, Polyline, InfoWindow } from "google-maps-react";
import React from "react";
import "./Map.css";
import Data from "../script/DataStore";
import * as Utils from "../script/utils"
import img_delete from "../img/ic_trash.png";
import img_cut from "../img/ic_cut.png";
import img_edit from "../img/ic_edit.png";


export class MapContainer extends React.Component {

	constructor() {
		super();
		this.state = {
			edit_points: [],
			new_points: [],
			edit_option: null,
		};
		this.map_ref = React.createRef();
		this.new_line = React.createRef();
	}

	componentDidMount() {
		Data.on("onImport", this.onImport.bind(this))
	}

	componentWillUnmount() {
		Data.removeAllListeners("onImport")
		this.map = null;
	}

	onMapReady(props, map) {
		console.log("map ready", props);
		this.map = map;
		this.map.setOptions({
			// this option can not be set via props in google-maps-react
			mapTypeControlOptions: {
				position: this.props.google.maps.ControlPosition.TOP_RIGHT,
				style: this.props.google.maps.MapTypeControlStyle.DROPDOWN_MENU
			}
		});
	}

	onMapRightClicked(props, map, event) {

	}

	onMapClicked(props, map, event) {
	}

	onMapZoomChanged(props, map, e) {
		console.log("zoom", map.getZoom());
	}


	onBoundsChanged(props, map) {
	}

	onMapIdle(props, map) {
	}


	onMapDragStart(props, map) {
	}


	onImport(lines) {
		var bounds = Utils.sumBounds(
			lines.map(line => Utils.getBounds(line))
		)
		this.focusAt(bounds)
	}

	focusAt(bounds) {
		if (this.map && bounds) {
			var rect = this.map_ref.current.getBoundingClientRect()
			var [center, zoom] = Utils.getZoomProp(bounds, rect.width, rect.height)
			this.map.panTo(center)
			this.map.setZoom(zoom)
			console.log("focus", center, zoom)
		}
	}

	onMouseOutPolyline() {
		this.setState(Object.assign({}, this.state, {
			edit_points: [],
		}))
	}

	updateEditMarkers(event) {
		if (this.state.edit_option) return
		const pos = {
			lat: event.latLng.lat(),
			lng: event.latLng.lng()
		};
		const line = this.props.edit
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
				},
				{
					position: {
						lat: (p1.lat + p2.lat) / 2,
						lng: (p1.lng + p2.lng) / 2,
					},
					type: "new",
					index: Math.max(i1, i2),
				},
				{
					position: p2,
					type: "exist",
					index: i2,
				},
			]
		}
		this.setState(Object.assign({}, this.state, {
			edit_points: points
		}))
	}

	onMarkerDragStart(edit, event) {
		console.log("drag-start")
		this.onMarkerMove(edit, edit.position)
	}

	onMarkerDrag(edit, event) {
		const pos = {
			lat: event.latLng.lat(),
			lng: event.latLng.lng()
		};
		edit.position = pos
		this.onMarkerMove(edit, pos);
	}

	onMarkerMove(edit, pos) {

		const line = this.props.edit
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

	onMarkerDragEnd(edit, marker, map, event) {
		console.log("drag-end")
		const pos = {
			lat: event.latLng.lat(),
			lng: event.latLng.lng()
		};
		const line = this.props.edit
		if (edit.type === "exist") {
			line.points[edit.index] = pos
		} else if (edit.type === "new") {
			line.points.splice(edit.index, 0, pos)
		}
		line.version += 1
		this.setState(Object.assign({}, this.state, {
			new_points: [],
		}))
		this.props.onUpdate()
	}

	showEditOption(edit, props, marker, event) {
		if (edit.type === "exist") {
			const line = this.props.edit
			if (line) {
				this.setState(Object.assign({}, this.state, {
					edit_option: {
						point: edit,
						marker: marker,
						line: line,
						terminal: (edit.index === 0 || edit.index === line.points.length - 1),
					}
				}))
			}
		}
	}

	cutPolyline() {
		const line = this.state.edit_option.line
		const name = line.name
		const points = line.points
		const point = this.state.edit_option.point
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

	deletePoint() {
		const line = this.state.edit_option.line
		const point = this.state.edit_option.point
		console.log("delete", line.name, `index:${point.index}`)
		line.points = line.points.filter((p, i) => i !== point.index)
		this.props.onUpdate()
		this.closeEditOption()
	}

	startPolylineExtension() {
		this.closeEditOption()
	}

	closeEditOption() {

		this.setState(Object.assign({}, this.state, {
			edit_option: null,
			edit_points: [],
		}))
	}

	render() {
		// check this.prop?.edit === this.state?.edit_option?.line
		if (this.state.edit_option) {
			if (!this.props.edit || this.state.edit_option.line.key !== this.props.edit.key) {
				this.setState(Object.assign({}, this.state, {
					edit_option: null,
				}))
			}
		}
		return (
			<div className='Map-container'>
				<div className='Map-relative' ref={this.map_ref}>

					<Map className='Map'
						ref={this.map_ref}
						google={this.props.google}
						zoom={14}
						initialCenter={{ lat: 35.681236, lng: 139.767125 }}
						onReady={this.onMapReady.bind(this)}
						onClick={this.onMapClicked.bind(this)}
						onBounds_changed={this.onBoundsChanged.bind(this)}
						onZoomChanged={this.onMapZoomChanged.bind(this)}
						onDragstart={this.onMapDragStart.bind(this)}
						onRightclick={this.onMapRightClicked.bind(this)}
						onIdle={this.onMapIdle.bind(this)}
						fullscreenControl={false}
						streetViewControl={false}
						zoomControl={true}
						gestureHandling={"greedy"}
						mapTypeControl={true}

					>
						{this.props.polylines.filter(line => line.visible && line.stroke)
							.map((line) => (
								<Polyline
									visible={line.visible}
									key={getKey(line)}
									path={line.points}
									strokeColor={line.color}
									strokeWeight={2}
									strokeOpacity={0.8}
									fillOpacity={0.5}
									clickable={false} />
							))}
						{this.props.polylines.filter(line => line.visible && !line.stroke)
							.map(line => {
								var icon = `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${line.color.slice(1)}`
								return line.points.map((point, i) => (
									<Marker
										visible={line.visible}
										key={getKey(line, i)}
										position={point}
										icon={icon} />
								))
							}).flat()}
						{this.props.edit ? (
							<Polyline
								key={getKey(this.props.edit, "edit")}
								path={this.props.edit.points}
								strokeColor={this.props.edit.color}
								strokeWeight={28}
								strokeOpacity={0.1}
								fillOpacity={0.0}
								clickable={true}
								onMouseout={this.onMouseOutPolyline.bind(this)}
								ref={(current) => {
									// onMousemove event not working on Polyline component!!
									if (current) current.polyline.addListener("mousemove", this.updateEditMarkers.bind(this))

								}}
							/>
						) : null}
						{this.props.edit ? (this.state.edit_option ? [this.state.edit_option.point] : this.state.edit_points).map(edit => {
							const line = this.props.edit
							const refCallback = (c) => {
								// "drag" event not working in Mark component
								if (c) {
									c.marker.addListener("dragstart", this.onMarkerDragStart.bind(this, edit))
									c.marker.addListener("drag", this.onMarkerDrag.bind(this, edit))
								}
							}
							var icon = {
								path: this.props.google.maps.SymbolPath.CIRCLE,
								scale: 10,
								strokeColor: line.color,
								strokeWeight: 1,
								fillColor: (edit.type === "exist" ? line.color : "#FFFFFF"),
								fillOpacity: 1.0
							}
							return (
								<Marker
									ref={refCallback}
									key={getKey(line, `edit_${edit.type}_${edit.index}`)}
									position={edit.position}
									icon={icon}
									draggable={true}
									onClick={this.showEditOption.bind(this, edit)}
									onDragend={this.onMarkerDragEnd.bind(this, edit)}>

								</Marker>
							)
						}) : null}
						<InfoWindow
							visible={!!this.state.edit_option}
							marker={this.state.edit_option ? this.state.edit_option.marker : null}
							onOpen={() => {
								// content of InfoWindow is passed as string value,
								// onClick callback object not registered via props
								var cut = document.getElementById("action-button-edit-cut")
								var remove = document.getElementById("action-button-edit-delete")
								var extend = document.getElementById("action-button-edit-extend")
								if (cut) {
									cut.onclick = this.cutPolyline.bind(this)
								}
								if (remove) {
									remove.onclick = this.deletePoint.bind(this)
								}
								if (extend) {
									extend.onclick = this.startPolylineExtension.bind(this)
								}
							}}
							onClose={this.closeEditOption.bind(this)}>

							<div className="edit-option">
								{this.state.edit_option && this.state.edit_option.terminal ? (
									<img
										id="action-button-edit-extend"
										className="action-button cut"
										alt="cut"
										src={img_edit} />
								) : (
										<img
											id="action-button-edit-cut"
											className="action-button cut"
											alt="cut"
											src={img_cut} />
									)}
								<img
									id="action-button-edit-delete"
									className="action-button delete"
									alt="delete"
									src={img_delete} />
							</div>
						</InfoWindow>
						{this.props.edit ? (

							<Polyline
								ref={this.new_line}
								key={getKey(this.props.edit, "edit_new")}
								path={this.state.new_points}
								strokeColor={this.props.edit.color}
								strokeWeight={4}
								strokeOpacity={1.0}
								fillOpacity={0.0}
								clickable={false} />
						) : null}
					</Map>

				</div>
			</div>

		)
	}
}

function getKey(line, suffix = null) {
	if (suffix) {
		suffix = `_${suffix}`
	} else {
		suffix = ""
	}
	return `${line.key}${suffix}_${line.version}`
}

const LoadingContainer = (props) => (
	<div className='Map-container'>Map is loading...</div>
);

export default GoogleApiWrapper({
	apiKey: process.env.REACT_APP_API_KEY,
	language: "ja",
	LoadingContainer: LoadingContainer,
})(MapContainer);