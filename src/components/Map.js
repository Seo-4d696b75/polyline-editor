import {GoogleApiWrapper, Map, Marker, Polygon, Polyline, Circle} from "google-maps-react";
import React from "react";
import "./Map.css";
import Data from "../script/DataStore";
import * as Utils from "../script/utils"

export class MapContainer extends React.Component {

	constructor(){
		super();
		this.state = {
			polylines: []
		};
		this.map_ref = React.createRef();
	}

	componentDidMount(){
		Data.on("onPolylinesUpdated", this.onUpdate.bind(this))
		//Data.on("onFocus", this.focusAt.bind(this))
	}

	componentWillUnmount(){
		this.map = null;
		Data.removeAllListeners("onPolylinesUpdated")
		//Data.removeAllListeners("onFocus")
	}

	onMapReady(props,map){
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

	onMapRightClicked(props,map,event){

		const pos = {
			lat: event.latLng.lat(),
			lng: event.latLng.lng()
		};
	}

	onMapClicked(props,map,event){
		const pos = {
			lat: event.latLng.lat(),
			lng: event.latLng.lng()
		};
	}

	onMapZoomChanged(props,map,e){
		console.log("zoom", map.getZoom());
	}


	onBoundsChanged(props,map){
	}

	onMapIdle(props,map){
	}

	
	onMapDragStart(props,map){
	}

	focusAt(bounds){
	}

	onUpdate(data){
		const list = data.lines
		const bounds = data.bounds
		console.log("onUpdate", list)
		this.setState(Object.assign({}, this.state, {
			polylines: list
		}))
		
		if ( this.map && bounds ){
			var rect = this.map_ref.current.getBoundingClientRect()
			var [center, zoom] = Utils.getZoomProp(bounds, rect.width, rect.height)
			this.map.panTo(center)
			this.map.setZoom(zoom)
			console.log("focus", center, zoom)
		}
	}

	render(){
		return(
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
							{this.state.polylines.filter( line => line.visible).map( (line,index) => (
								<Polyline
									key={index}
									path={line.points}
									strokeColor={line.color}
									strokeWeight={2}
									strokeOpacity={0.8}
									fillOpacity={0.0}
									clickable={false} />
							))}
						</Map>
						
				</div>
			</div>
			
		)
	}
}

const LoadingContainer = (props) => (
	<div className='Map-container'>Map is loading...</div>
);

export default GoogleApiWrapper({
	apiKey: process.env.REACT_APP_API_KEY,
	language: "ja",
	LoadingContainer: LoadingContainer,
})(MapContainer);