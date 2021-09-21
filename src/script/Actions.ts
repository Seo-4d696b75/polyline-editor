import { Dispatch } from "redux";
import { ActionType, GlobalState, GlobalAction } from "./Reducer"
import { store } from "./Store"
import { Polyline, Bounds, PolylineProps } from "./types"
import { parseHSV } from "../script/color";
import * as Utils from "../script/utils"

export function closeDialog() {
	store.dispatch({
		type: ActionType.Close,
		payload: null,
	})
}

export function requestImport(): void {
	store.dispatch({
		type: ActionType.Import,
		payload: null,
	})
}

export function requestExport(polyline: Polyline) {
	store.dispatch({
		type: ActionType.Export,
		payload: polyline,
	})
}

export type PolylineFactory = () => PolylineProps
export type PolylineUpdate = (lines: Array<PolylineProps>, factory: PolylineFactory) => Array<PolylineProps>
export function updateLines(arg?: PolylineUpdate | Array<PolylineProps>) {
	store.dispatch((dispatch: Dispatch<GlobalAction>, getState: () => GlobalState) => {
		var state = getState()
		// prepare factory
		var hue = state.line_hue
		var cnt = state.line_cnt
		var lines: Array<PolylineProps>
		if (Array.isArray(arg)) {
			lines = arg
		} else if (arg) {
			const factory = () => {

				var color = parseHSV(hue, 1, 1)
				hue += 0.35
				hue -= Math.floor(hue)
				cnt += 1
				var key = cnt
				return {
					key: key,
					version: 0,
					color: color,
					stroke: true,
					visible: true,
					name: `polyline-${key}`,
					setting: false,
					points: [],
				}
			}
			lines = arg(state.lines, factory)
		} else {
			lines = [...state.lines]
		}
		dispatch({
			type: ActionType.Update,
			payload: {
				lines: lines,
				hue: hue,
				cnt: cnt,
			}
		})
	})
}

export function importPolyline(lines: Array<Polyline>) {
	console.log("import", lines)
	updateLines((polylines: Array<PolylineProps>, factory: PolylineFactory) => {
		lines.forEach((line, i) => {
			var obj = factory()
			obj.points = line
			polylines.push(obj)
		})
		return polylines
	})
	var bounds = Utils.sumBounds(
		lines.map(line => Utils.getBounds(line))
	)
	focusAt(bounds)
}

export function focusAt(bounds: Bounds) {
	store.dispatch({
		type: ActionType.Focus,
		payload: bounds,
	})
}

export function setTarget(line: PolylineProps | null) {
	store.dispatch({
		type: ActionType.Target,
		payload: line,
	})
}
