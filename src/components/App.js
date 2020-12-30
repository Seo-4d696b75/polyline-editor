import React from 'react';
import './App.css';
import Header from './Header'
import Editor from './Editor'
import Dialog from './Dialog'
import {HashRouter, Route} from 'react-router-dom';

export default class APP extends React.Component {
	
	render(){
		return (
			<div className="App">
				<HashRouter basename='/'>
						<Route exact path='/' render={()=>
							<div>
								<Header></Header>
								<Editor></Editor>
								<Dialog></Dialog>
							</div>
						}></Route>
				</HashRouter>
			</div>
		)
	}
}
