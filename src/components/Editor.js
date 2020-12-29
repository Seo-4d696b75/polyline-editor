import React from 'react';
import './Editor.css';
import img_setting from "../img/ic_settings.png";
import img_delete from "../img/ic_delete.png";
import { CSSTransition } from "react-transition-group";
import * as Action from "../script/Actions";
import { Button } from "react-bootstrap";
import Data from "../script/DataStore";
import {parseHSV} from "../script/color";
import * as utils from "../script/utils"

export default class Editor extends React.Component {

  constructor() {
    super();
    this.hue = 0.0
    this.state = {
      polylines: []
    }
  }

  componentDidMount(){
    Data.on("onImport", this.onImport.bind(this))
  }

  componentWillUnmount(){
    Data.removeAllListeners("onImport")
  }

  onPolylineVisibleChanged(line, event) {
    line.visible = event.currentTarget.checked
    this.updatePolylines()
  }

  onPolylineSetting(line, event) {
    line.setting = true
    this.updatePolylines()
  }

  updatePolylines(bounds) {
    this.setState(Object.assign({}, this.state))
    Action.updatePolylines(this.state.polylines, bounds)
  }

  closeSetting(line, event) {
    line.setting = false
    this.updatePolylines()
  }

  onImport(lines){
    console.log("import", lines)
    const size = this.state.polylines.length
    lines.forEach( (line,i) => {
      var color = parseHSV(this.hue, 1, 1)
      this.hue += 0.35
      this.hue -= Math.floor(this.hue)
      this.state.polylines.push({
        color: color,
        visible: true,
        name: `polyline-${size + i}`,
        setting: false,
        points: line,
      })
    })
    var bounds = utils.sumBounds(
      lines.map( line => utils.getBounds(line))
    )
    setTimeout( () => {
      this.updatePolylines(bounds)
    }, 10)

  }

  render() {
    return (
      <div className="editor-container">
        <div className="editor-relative">
          <p>Editor Panel</p>
          <div className="polyline-scroll">
            <table>
              <tbody>
                {this.state.polylines.map((polyline, index) => (
                  <tr key={index}
                    className="polyline-frame">
                    <td>
                      <input
                        className="toggle-visible"
                        id={`toggle-${index}`}
                        type="checkbox"
                        checked={polyline.visible}
                        onChange={this.onPolylineVisibleChanged.bind(this, polyline)}
                      />
                    </td>
                    <td><div className="polyline-color" style={{ backgroundColor: polyline.color }}></div></td>
                    <td><div className="polyline-name">{polyline.name}</div></td>
                    <td>
                      <div className="polyline-setting">

                        <img className="action-button setting"
                          src={img_setting}
                          alt="setting polyline"
                          onClick={this.onPolylineSetting.bind(this, polyline)}></img>


                        <CSSTransition
                          in={polyline.setting}
                          className="polyline-setting-container"
                          timeout={200}>

                          <div className="polyline-setting-container">
                            <div className="polyline-setting-frame">

                              <img
                                src={img_delete}
                                alt="close dialog"
                                className="action-button close"
                                onClick={this.closeSetting.bind(this, polyline)} />
                              <p>Display Setting</p>
                            </div>

                          </div>

                        </CSSTransition>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="editor-footer">
            <Button
              variant="primary"
              size="lg"
              onClick={() => { Action.requestImport() }}>Add</Button>
          </div>
        </div>
      </div>
    )
  }
}
