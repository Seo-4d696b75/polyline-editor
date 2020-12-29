import {GoogleApiWrapper, Map, Marker, Polygon, Polyline, Circle} from "google-maps-react";
import React from "react";
import "./Map.css";
import StationService from "../script/StationService";

export class MapContainer extends React.Component {

	constructor(){
		super();
		this.state = {
		};
	}

	componentDidMount(){
		
	}

	componentWillUnmount(){
		StationService.release();
		this.map = null;
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


	render(){
		return(
			<div className='Map-container'>
				<div className='Map-relative' ref={this.map_ref}>

						<Map className='Map' 
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