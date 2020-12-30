import React from 'react';
import './Editor.css';
import img_setting from "../img/ic_settings.png";
import img_delete from "../img/ic_delete.png";
import img_export from "../img/ic_upload.png";
import { CSSTransition } from "react-transition-group";
import * as Action from "../script/Actions";
import { Button } from "react-bootstrap";
import Data from "../script/DataStore";
import { parseHSV } from "../script/color";
import * as utils from "../script/utils"

export default class Editor extends React.Component {

  constructor() {
    super();
    this.hue = 0.0
    this.cnt = 0
    this.state = {
      polylines: []
    }
  }

  componentDidMount() {
    Data.on("onImport", this.onImport.bind(this))
  }

  componentWillUnmount() {
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

  updatePolylines(bounds=null) {
    this.setState(Object.assign({}, this.state))
    Action.updatePolylines(this.state.polylines, bounds)
  }

  closeSetting(line, event) {
    line.setting = false
    this.updatePolylines()
  }

  deletePolyline(key, event){
    this.state.polylines = this.state.polylines.filter( line => line.key !== key)
    this.updatePolylines()
  }

  onImport(lines) {
    console.log("import", lines)
    lines.forEach((line, i) => {
      var color = parseHSV(this.hue, 1, 1)
      this.hue += 0.35
      this.hue -= Math.floor(this.hue)
      this.cnt += 1
      this.state.polylines.push({
        key: this.cnt,
        color: color,
        visible: true,
        name: `polyline-${this.cnt}`,
        setting: false,
        points: line,
      })
    })
    var bounds = utils.sumBounds(
      lines.map(line => utils.getBounds(line))
    )
    setTimeout(() => {
      this.updatePolylines(bounds)
    }, 10)

  }

  render() {
    return (
      <div className="editor-container">
        <div className="editor-relative">
          <p className="panel-title">ポリライン一覧</p>
          {this.state.polylines.length == 0 ? (
            <div className="import-hint">表示するデータがありません</div>
          ) : (

              <div className="polyline-scroll">
                <table>
                  <tbody>
                    {this.state.polylines.map((polyline) => (
                      <tr key={polyline.key}
                        className="polyline-frame">
                        <td>
                          <input
                            className="toggle-visible"
                            id={`toggle-${polyline.key}`}
                            type="checkbox"
                            checked={polyline.visible}
                            onChange={this.onPolylineVisibleChanged.bind(this, polyline)}
                          />
                        </td>
                        <td><div className="polyline-color" style={{ backgroundColor: polyline.color }}></div></td>
                        <td><div className="polyline-name">{polyline.name}</div></td>
                        <td>
                          <img className="action-button export"
                            src={img_export}
                            onClick={() => Action.requestExport(polyline.points)}></img>
                        </td>
                        <td>
                          <img className="action-button delete"
                            src={img_delete}
                            onClick={this.deletePolyline.bind(this, polyline.key)}></img>
                        </td>
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

            )}
          <div className="editor-footer">
            <Button
              variant="primary"
              size="lg"
              onClick={() => { Action.requestImport() }}>追加</Button>
          </div>
        </div>
      </div>
    )
  }
}
