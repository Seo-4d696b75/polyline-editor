import { GoogleApiWrapper, Map, Marker, Polyline, InfoWindow, GoogleAPI, IMapProps } from "google-maps-react";
import React from "react";
import "./Map.css";
import * as Extension from "./PolylineExtension"
import * as Edit from "./PolylineEdit"
import Data from "../script/DataStore";
import * as Utils from "../script/utils"
import img_delete from "../img/ic_trash.png";
import img_cut from "../img/ic_cut.png";
import img_edit from "../img/ic_edit.png";
import img_done from "../img/ic_check.png"
import img_merge from "../img/ic_append.png"
import img_copy from "../img/ic_copy.png"
import { EditOption, EditPoint, PolylineProps, Bounds, LatLng, MapState } from "../script/types"

interface MapProps {
	google: GoogleAPI
	polylines: Array<PolylineProps>
	edit: PolylineProps | null
	onUpdate: ((list?: Array<PolylineProps>) => void)
	onAdd: (() => PolylineProps)
}

export class MapContainer extends React.Component<MapProps, MapState> {

	state: MapState = {
		edit_points: [],
		edit_line: null,
		edit_option: null,
		edit_extend: null,
	}


	map_ref = React.createRef<HTMLDivElement>();
	new_line = React.createRef<Polyline>();
	map: google.maps.Map | null = null

	componentDidMount() {
		Data.on("onImport", this.onImport.bind(this))
	}

	componentWillUnmount() {
		Data.removeAllListeners("onImport")
		this.map = null;
	}

	onMapReady(props?: IMapProps, map?: google.maps.Map, event?: any) {
		console.log("map ready", props);
		if (map) {
			this.map = map;
			this.map.setOptions({
				// this option can not be set via props in google-maps-react
				mapTypeControlOptions: {
					position: google.maps.ControlPosition.TOP_RIGHT,
					style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
				}
			});
			this.map.addListener("mousemove", this.onMouseMove.bind(this))
		}
	}

	onMapRightClicked(props?: IMapProps, map?: google.maps.Map, event?: any) {

	}

	onMapZoomChanged(props?: IMapProps, map?: google.maps.Map, event?: any) {
		console.log("zoom", map?.getZoom());
	}

	onBoundsChanged(props?: IMapProps, map?: google.maps.Map, event?: any) {
	}

	onMapIdle(props?: IMapProps, map?: google.maps.Map, event?: any) {
	}


	onMapDragStart(props?: IMapProps, map?: google.maps.Map, event?: any) {
	}

	onMouseMove(event: any) {
		Extension.update.call(this, event)
	}

	onMapClicked(props?: IMapProps, map?: google.maps.Map, event?: any) {

		const pos = {
			lat: event.latLng.lat(),
			lng: event.latLng.lng()
		}
		Extension.addPoint.call(this, pos)
	}

	onImport(lines: Array<Array<LatLng>>) {
		var bounds = Utils.sumBounds(
			lines.map(line => Utils.getBounds(line))
		)
		this.focusAt(bounds)
	}

	focusAt(bounds: Bounds) {
		var e = this.map_ref.current
		if (this.map && bounds && e) {
			var rect = e.getBoundingClientRect()
			var prop = Utils.getZoomProp(bounds, rect.width, rect.height)
			this.map.panTo(prop.center)
			this.map.setZoom(prop.zoom)
			console.log("focus", prop)
		}
	}

	onMarkerDragStart(edit: EditPoint, event: any) {
		console.log("drag-start")
		Edit.updateNewLine.call(this, edit, edit.position)
	}

	onMarkerDrag(edit: EditPoint, event: any) {
		const pos = {
			lat: event.latLng.lat(),
			lng: event.latLng.lng()
		};
		edit.position = pos
		Edit.updateNewLine.call(this, edit, pos);
	}

	onMarkerDragEnd(edit: EditPoint, event?: any) {
		console.log("drag-end")
		const pos = {
			lat: event.latLng.lat(),
			lng: event.latLng.lng()
		};
		Edit.updatePosition.call(this, edit, pos)
	}

	showEditOption(edit: EditPoint, props?: any, marker?: google.maps.Marker, event?: any) {
		if ( marker ){
			Edit.showOption.call(this, edit, marker)
		}
	}

	closeEditOption() {

		this.setState(Object.assign({}, this.state, {
			edit_option: null,
		}))
		Edit.closeMarkers.call(this)
	}

	render() {

		return (
			<div className='Map-container'>
				<div className='Map-relative' ref={this.map_ref}>

					<Map
						google={this.props.google}
						zoom={14}
						initialCenter={{ lat: 35.681236, lng: 139.767125 }}
						onReady={this.onMapReady.bind(this)}
						onClick={this.onMapClicked.bind(this)}
						onBoundsChanged={this.onBoundsChanged.bind(this)}
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

						{this.props.polylines.filter(line => line.visible && line.stroke)
							.map((line) => (
								<Polyline
									key={getKey(line, "edit")}
									path={line.points}
									strokeColor={line.color}
									strokeWeight={28}
									strokeOpacity={0}
									fillOpacity={0.0}
									clickable={true}
									onMouseout={Edit.closeMarkers.bind(this)}
									ref={(current: any) => {
										// onMousemove event not working on Polyline component!!
										if ( current ){
											if ( current.polyline instanceof google.maps.Polyline ){
												current.polyline.addListener("mousemove", (event: any) => {
													Extension.update.call(this, event)
													Edit.updateMarkers.call(this, line, event)
												})
											} else {
												console.error("cannot find google.maps.polyline in", current)
											}
										}

									}}
								/>
							))}
						{this.state.edit_points.map(edit => {
							const line = edit.line
							const refCallback = (c: any | null) => {
								// "drag" event not working in Mark component
								if (c) {
									if (c.marker instanceof google.maps.Marker) {
										c.marker.addListener("dragstart", this.onMarkerDragStart.bind(this, edit))
										c.marker.addListener("drag", this.onMarkerDrag.bind(this, edit))
										c.marker.addListener("dragend", this.onMarkerDragEnd.bind(this, edit))
									} else {
										console.error("can not find google.maps.Marker by property name: marker in", c)
									}
								}
							}
							var icon = {
								path: this.props.google.maps.SymbolPath.CIRCLE,
								scale: 10,
								strokeColor: line.color,
								strokeWeight: 1,
								fillColor: (edit.type === "new" ? "#FFFFFF" : line.color),
								fillOpacity: 1.0
							}
							return (
								<Marker
									ref={refCallback}
									key={getKey(line, `edit_${edit.type}_${edit.index}`)}
									position={edit.position}
									icon={icon}
									draggable={true}
									onClick={this.showEditOption.bind(this, edit)}>
								</Marker>
							)
						})}
						{this.renderOptionInfo()}
						{this.state.edit_line ? (

							<Polyline
								ref={this.new_line}
								key={getKey(this.state.edit_line, "edit_new")}
								path={[]}
								strokeColor={this.state.edit_line.color}
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

	renderOptionInfo(): any{
		//if ( !this.state.edit_option ) return null
		const option = this.state.edit_option
		const addCallback = () => {
			if ( !option ) return
			option as EditOption
			// content of InfoWindow is passed as string value,
			// onClick callback object not registered via props
			var cut = document.getElementById("action-button-edit-cut")
			var remove = document.getElementById("action-button-edit-delete")
			var extend = document.getElementById("action-button-edit-extend")
			if (cut) {
				cut.onclick = Edit.cutPolyline.bind(this, option)
			}
			if (remove) {
				remove.onclick = Edit.deletePoint.bind(this, option)
			}
			if (extend) {
				extend.onclick = Extension.start.bind(this, option.point)
			}
			var comp = document.getElementById("action-button-edit-extend-complete")
			if (comp) {
				comp.onclick = Extension.complete.bind(this)
			}
			var back = document.getElementById("action-button-edit-extend-back")
			if (back) {
				back.onclick = Extension.undoPoint.bind(this)
			}
			var copy = document.getElementById("action-button-edit-extend-copy")
			if (copy) {
				copy.onclick = Extension.addPoint.bind(this, option.point.position)
			}
			var merge = document.getElementById("action-button-edit-extend-merge")
			if (merge) {
				merge.onclick = Extension.merge.bind(this, option.point)
			}
		}
		var content = (
			<div>nothing to show</div>
		)
		if (option) {
			switch (option.type) {
				case "middle":
					content = (
						<div className="edit-option">
							<img
								id="action-button-edit-cut"
								className="action-button cut"
								alt="cut"
								src={img_cut} />
							<img
								id="action-button-edit-delete"
								className="action-button delete"
								alt="delete"
								src={img_delete} />
						</div>
					)
					break
				case "terminal":
					content = (
						<div className="edit-option">
							<img
								id="action-button-edit-extend"
								className="action-button cut"
								alt="extend"
								src={img_edit} />
							<img
								id="action-button-edit-delete"
								className="action-button delete"
								alt="delete"
								src={img_delete} />
						</div>
					)
					break
				case "extend":
					content = (
						<div className="edit-option">
							<img
								id="action-button-edit-extend-complete"
								className="action-button cut"
								alt="complete"
								src={img_done} />
							<img
								id="action-button-edit-extend-back"
								className="action-button delete"
								alt="back"
								src={img_delete} />
						</div>
					)
					break
				case "extend-target":
					content = (
						<div className="edit-option">
							<img
								id="action-button-edit-extend-copy"
								className="action-button cut"
								alt="complete"
								src={img_copy} />
							<img
								id="action-button-edit-extend-merge"
								className="action-button delete"
								alt="back"
								src={img_merge} />
						</div>
					)
					break
				default:
					break
			}
		}
		return (
			<InfoWindow
				visible={ !!option && option.line.visible}
				marker={option?.marker}
				onOpen={addCallback}
				onClose={this.closeEditOption.bind(this)}>
				{content}
			</InfoWindow>
		)
	}
}



function getKey(line: PolylineProps, suffix?: any) {
	if (suffix) {
		suffix = `_${suffix}`
	} else {
		suffix = ""
	}
	return `${line.key}${suffix}_${line.version}`
}

const LoadingContainer = (props: any) => (
	<div className='Map-container'>Map is loading...</div>
);

export default GoogleApiWrapper({
	apiKey: process.env.REACT_APP_API_KEY,
	language: "ja",
	LoadingContainer: LoadingContainer,
})(MapContainer);

console.log("api-key", process.env.REACT_APP_API_KEY)