import React from 'react';
import './App.css';
import Header from './Header'
import Editor from './Editor'
import Dialog from './Dialog'

export default class APP extends React.Component {
	
	render(){
		return (
			<div className="App">
			<Header></Header>
			<Editor></Editor>
			<Dialog></Dialog>
			</div>
		)
	}
}
