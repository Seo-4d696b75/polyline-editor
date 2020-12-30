import dispatcher from "./Dispatcher";

export function requestImport(){
	dispatcher.dispatch({
		type: "import",
		value: null,
	})
}

export function requestExport(polyline){
	dispatcher.dispatch({
		type: "export",
		value: polyline,
	})
}

export function importPolyline(lines){
	dispatcher.dispatch({
		type: "polyline",
		value:lines,
	})
}

export function focusAt(bounds){
	dispatcher.dispatch({
		type: "focus",
		value: bounds,
	})
}
