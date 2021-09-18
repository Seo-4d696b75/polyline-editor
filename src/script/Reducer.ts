import { Reducer } from "redux"
import { Bounds, PolylineProps, LatLng } from "../script/types"
import { PropsEvent, createEvent, createIdleEvent } from "./Event"

export enum ModalType {
  Import,
  Export
}

export interface ModalProps<T, V> {
  type: T,
  value: V
}

export type ImportModalProps = ModalProps<ModalType.Import, null>
export type ExportModalProps = ModalProps<ModalType.Export, Array<LatLng>>

export interface GlobalState {
  modal: ImportModalProps | ExportModalProps | null
  lines: Array<PolylineProps>
  target: PolylineProps | null
  line_hue: number
  line_cnt: number
  focus_map: PropsEvent<Bounds>
}

export enum ActionType {
  Close,
  Import,
  Export,
  Focus,
  Target,
  Update,
}

interface Action<TAction, TPayload = null> {
  type: TAction
  payload: TPayload
}

type CloseAction = Action<ActionType.Close, null>
type ImportAction = Action<ActionType.Import, null>
type ExportAction = Action<ActionType.Export, Array<LatLng>>
type TargetAction = Action<ActionType.Target, PolylineProps | null>
type FocusAction = Action<ActionType.Focus, Bounds>

type UpdateAction = Action<ActionType.Update, {
  lines: Array<PolylineProps>,
  hue: number,
  cnt: number,
}>

export type GlobalAction =
  ImportAction |
  ExportAction |
  UpdateAction |
  FocusAction |
  TargetAction |
  CloseAction

const init_state: GlobalState = {
  modal: null,
  lines: [],
  target: null,
  line_hue: 0.0,
  line_cnt: 0,
  focus_map: createIdleEvent()
}

const reducer: Reducer<GlobalState, GlobalAction> = (
  state: GlobalState = init_state,
  action: GlobalAction
): GlobalState => {
  switch (action.type) {
    case ActionType.Import: {
      return {
        ...state,
        modal: {
          type: ModalType.Import,
          value: null
        }
      }
    }
    case ActionType.Export: {
      return {
        ...state,
        modal: {
          type: ModalType.Export,
          value: action.payload,
        }
      }
    }
    case ActionType.Focus: {
      return {
        ...state,
        focus_map: createEvent(action.payload),
      }
    }
    case ActionType.Target: {
      return {
        ...state,
        target: action.payload,
      }
    }
    case ActionType.Update: {
      return {
        ...state,
        lines: action.payload.lines,
        line_hue: action.payload.hue,
        line_cnt: action.payload.cnt,
      }
    }
    case ActionType.Close: {
      return {
        ...state,
        modal: null,
      }
    }
    default: {
      return state
    }
  }
}

export default reducer