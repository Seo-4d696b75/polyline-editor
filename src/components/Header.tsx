import React from "react";
import "./Header.css"
import img_setting from "../img/ic_settings.png";
import img_delete from "../img/ic_delete.png";
import { CSSTransition } from "react-transition-group";

interface HeaderState {
	show_setting: boolean
}


export default class Header extends React.Component<{}, HeaderState> {

	state: HeaderState = {
		show_setting: false,
	}

	showSetting(): void {
		this.setState(Object.assign({}, this.state, {
			show_setting: true,
		}));
	}

	closeSetting(): void {
		this.setState(Object.assign({}, this.state, {
			show_setting: false,
		}));
	}

	render() {
		return (
			<div className='Map-header'>
				<div className="Header-frame">

					<div className="App-title">Polyline-Editor</div>
					<div className="Action-container">
						<img className="Action-button setting"
							src={img_setting}
							alt="setting"
							onClick={this.showSetting.bind(this)}></img>
					</div>
				</div>
				<CSSTransition
					in={this.state.show_setting}
					className="Setting-container"
					timeout={400}>

					<div className="Setting-container">
						<div className="Setting-frame">

							<img
								src={img_delete}
								alt="close dialog"
								className="Action-button close"
								onClick={this.closeSetting.bind(this)} />
								<p>Setting Panel</p>
						</div>

					</div>

				</CSSTransition>
			</div>
		);
	}
}