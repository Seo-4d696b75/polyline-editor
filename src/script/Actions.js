import dispatcher from "./Dispatcher";

export function updatePolylines(list, bounds){
	console.log(list)
	dispatcher.dispatch({
		type: "update",
		value: {
			lines: list,
			bounds: bounds,
		}
	})
}

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

export function focusAtMap(bounds){
	dispatcher.dispatch({
		type: "focus",
		value: bounds,
	})
}