import { GoogleApiWrapper, Map, Marker, Polyline, InfoWindow, GoogleAPI, IMapProps } from "google-maps-react";
import React from "react";
import "./Map.css";
import * as Edit from "./PolylineEdit"
import * as Utils from "../script/utils"
import img_delete from "../img/ic_trash.png";
import img_cut from "../img/ic_cut.png";
import img_edit from "../img/ic_edit.png";
import img_done from "../img/ic_check.png"
import img_merge from "../img/ic_append.png"
import img_copy from "../img/ic_copy.png"
import { EditOption, PolylineProps, Bounds, EditState, PointSelector } from "../script/types"
import { PropsEvent } from "../script/Event";

interface MapState {
	edit_state: EditState | null
	selectors: Array<PointSelector>
	edit_option: EditOption | null
}

export interface MapProps {
	polylines: Array<PolylineProps>
	target: PolylineProps | null
	focus: PropsEvent<Bounds>
}

interface WrappedMapProps extends MapProps {
	google: GoogleAPI
}

function getLatLng(event: any) {
	return {
		lat: event.latLng.lat(),
		lng: event.latLng.lng()
	}
}

function isShowEditingLine(state: MapState): boolean {
	return state.edit_state !== null
}

export class MapContainer extends React.Component<WrappedMapProps, MapState> {

	state: MapState = {
		edit_state: null,
		selectors: [],
		edit_option: null,
	}


	map_ref = React.createRef<HTMLDivElement>();
	new_line = React.createRef<Polyline>();
	map: google.maps.Map | null = null

	componentDidUpdate() {
		this.props.focus.observe("map", (area: Bounds) => {
			this.focusAt(area)
		})
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

	onMouseMove(event: any) {
		Edit.updateExtendingPoint.call(this, getLatLng(event))
	}

	onMapClicked(props?: IMapProps, map?: google.maps.Map, event?: any) {
		Edit.addPointExtending.call(this, getLatLng(event))
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

	closeEditOption() {
		if (this.state.edit_state === EditState.Extending) {
			this.setState({
				...this.state,
				edit_option: null
			})
		} else {
			this.setState({
				...this.state,
				edit_option: null,
				selectors: [],
				edit_state: null,
			})
		}
	}

	disableSelectors() {
		if (this.state.edit_state === EditState.EdgeFocused) {
			this.setState({
				...this.state,
				selectors: [],
				edit_state: null,
			})
		}
	}

	render() {
		const polylines = this.props.polylines
		return (
			<div className='Map-container'>
				<div className='Map-relative' ref={this.map_ref}>

					<Map
						google={this.props.google}
						zoom={14}
						initialCenter={{ lat: 35.681236, lng: 139.767125 }}
						onReady={this.onMapReady.bind(this)}
						onClick={this.onMapClicked.bind(this)}
						fullscreenControl={false}
						streetViewControl={false}
						zoomControl={true}
						gestureHandling={"greedy"}
						mapTypeControl={true}

					>
						{polylines.filter(line => line.visible && line.stroke)
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
						{polylines.filter(line => line.visible && !line.stroke)
							.map(line => {
								var icon = `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${line.color.slice(1)}`
								return line.points.map((point, i) => (
									<Marker
										visible={line.visible}
										key={getKey(line, i)}
										position={point}
										draggable={true}
										ref={(current: any) => {
											if (current) {
												if (current.marker instanceof google.maps.Marker) {
													current.marker.addListener("dragend", (e: any) => {
														Edit.updatePosition.call(this, line, i, getLatLng(e), "exist")
													})
												} else {
													console.error("fail to find google.maps.Marker in ", current)
												}
											}
										}}
										icon={icon} />
								))
							}).flat()}

						{polylines.filter(line => line.visible && line.stroke && line.key === this.props.target?.key)
							.map((line, i) => (
								<Polyline
									key={getKey(line, "edit")}
									path={line.points}
									strokeColor={line.color}
									strokeWeight={28}
									strokeOpacity={0}
									fillOpacity={0.0}
									clickable={true}
									zIndex={this.props.target?.key === line.key ? polylines.length : i}
									onMouseout={this.disableSelectors.bind(this)}
									ref={(current: any) => {
										// onMousemove event not working on Polyline component!!
										if (current) {
											if (current.polyline instanceof google.maps.Polyline) {
												current.polyline.addListener("mousemove", (event: any) => {
													var pos = getLatLng(event)
													Edit.updateExtendingPoint.call(this, pos)
													Edit.updateSelectors.call(this, line, pos)
												})
											} else {
												console.error("cannot find google.maps.polyline in", current)
											}
										}

									}}
								/>
							))}
						{this.state.selectors.map(selector => {
							const line = selector.line
							const draggable = !!(selector.onDrag || selector.onDragStart || selector.onDragEnd)
							const refCallback = (c: any | null) => {
								// "drag" event not working in Mark component
								if (c) {
									if (c.marker instanceof google.maps.Marker) {
										c.marker.addListener("dragstart", (e: any) => { selector.onDragStart?.call(this, getLatLng(e), selector) })
										c.marker.addListener("drag", (e: any) => { selector.onDrag?.call(this, getLatLng(e), selector) })
										c.marker.addListener("dragend", (e: any) => { selector.onDragEnd?.call(this, getLatLng(e), selector) })
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
								fillColor: (selector.fillColor ? selector.fillColor : line.color),
								fillOpacity: 1.0
							}
							return (
								<Marker
									ref={refCallback}
									key={getKey(line, `selector_${selector.key}`)}
									position={selector.position}
									icon={icon}
									draggable={draggable}
									onClick={(prop?: any, marker?: google.maps.Marker) => {
										if (marker) selector.onClick?.call(this, marker, selector)
									}}>
								</Marker>
							)
						})}
						{this.renderOptionInfo()}
						{this.props.target && isShowEditingLine(this.state) ? (

							<Polyline
								ref={this.new_line}
								key={getKey(this.props.target, "edit_new")}
								path={[]}
								strokeColor={this.props.target.color}
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

	renderOptionInfo(): any {
		const option = this.state.edit_option
		const addCallback = () => {
			if (!option) return
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
				extend.onclick = Edit.startExtending.bind(this, option.point)
			}
			var comp = document.getElementById("action-button-edit-extend-complete")
			if (comp) {
				comp.onclick = Edit.completeExtending.bind(this)
			}
			var back = document.getElementById("action-button-edit-extend-back")
			if (back) {
				back.onclick = Edit.deletePointExtending.bind(this)
			}
			var copy = document.getElementById("action-button-edit-extend-copy")
			if (copy) {
				// TODO
			}
			var merge = document.getElementById("action-button-edit-extend-merge")
			if (merge) {
				// TODO
			}
		}
		var content = (
			<div>nothing to show</div>
		)
		if (option) {
			switch (option.type) {
				case "exist-middle":
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
				case "exist-terminal":
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
					// TODO
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
				visible={!!option && option.line.visible}
				marker={option?.marker ? option?.marker : undefined}
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