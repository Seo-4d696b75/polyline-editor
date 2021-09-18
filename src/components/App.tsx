import React from 'react';
import './App.css';
import Header from './Header'
import Editor from './Editor'
import Dialog from './Dialog'

import { Provider } from "react-redux"
import { store } from "../script/Store"

export default class APP extends React.Component {

	render() {
		return (
			<div className="App">
				<Provider store={store}>
					<Header></Header>
					<Editor></Editor>
					<Dialog></Dialog>
				</Provider>
			</div>
		)
	}
}
