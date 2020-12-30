import { EventEmitter } from "events";
import dispatcher from "./Dispatcher";


class DataStore extends EventEmitter {
	constructor(){
		super();
		// initial value
		this.data = {
		};
	}

	getData(){
		return this.data;
	}

	handleActions(action){
		//console.log("DataStore recived an action", action);
		switch(action.type){
			case "import":{
				this.emit("onImportRequested", null)
				break
			}
			case "export":{
				this.emit("onExportRequested", action.value)
				break
			}
			case "polyline":{
				this.emit("onImport", action.value)
				break
			}
			case "focus":{
				this.emit("onFocus", action.value)
				break
			}
			default: {
				console.log("unknown action type.", action.type);
			}
		}
	}

}

const dataStore = new DataStore();
dispatcher.register(dataStore.handleActions.bind(dataStore));

export default dataStore;