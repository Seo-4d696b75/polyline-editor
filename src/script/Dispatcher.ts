import {Dispatcher} from "flux";

export interface ActionPayload {
  type: string
  value: any
}

export const dispatcher = new Dispatcher<ActionPayload>();