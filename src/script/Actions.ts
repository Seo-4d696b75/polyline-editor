import {dispatcher} from "./Dispatcher";
import {Polyline, Bounds} from "./types"

export function requestImport(): void{
	dispatcher.dispatch({
		type: "import",
		value: null,
	})
}

export function requestExport(polyline: Polyline){
	dispatcher.dispatch({
		type: "export",
		value: polyline,
	})
}

export function importPolyline(lines: Array<Polyline>){
	dispatcher.dispatch({
		type: "polyline",
		value:lines,
	})
}

export function focusAt(bounds: Bounds){
	dispatcher.dispatch({
		type: "focus",
		value: bounds,
	})
}
