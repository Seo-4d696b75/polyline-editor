import React from 'react';
import './Editor.css';
import Map from "./Map"
import img_setting from "../img/ic_settings.png";
import img_delete from "../img/ic_trash.png";
import img_close from "../img/ic_delete.png";
import img_export from "../img/ic_upload.png";
import { CSSTransition } from "react-transition-group";
import * as Action from "../script/Actions";
import { Button } from "react-bootstrap";
import Data from "../script/DataStore";
import { parseHSV } from "../script/color";

export default class Editor extends React.Component {

  constructor() {
    super();
    this.hue = 0.0
    this.cnt = 0
    this.state = {
      polylines: [],
      edit_line: null,
    }
  }

  componentDidMount() {
    Data.on("onImport", this.onImport.bind(this))
  }

  componentWillUnmount() {
    Data.removeAllListeners("onImport")
  }

  onPolylineVisibleChanged(line, event) {
    var value = event.currentTarget.checked
    line.visible = value
    if ( !value && this.state.edit_line && this.state.edit_line.key === line.key ){
      this.state.edit_line = null
    }
    this.updatePolylines(this.state.polylines)
  }

  onPolylineSetting(line, event) {
    line.setting = true
    this.updatePolylines(this.state.polylines)
  }

  updatePolylines(list) {
    if (!list){
      list = this.state.polylines
    }
    this.setState(Object.assign({}, this.state, {
      polylines: list
    }))
  }

  setEditLine(line){
    line.visible = true
    this.setState(Object.assign({}, this.state, {
      edit_line: line,
    }))
  }

  closeSetting(line, event) {
    line.setting = false
    this.updatePolylines(this.state.polylines)
  }

  deletePolyline(key, event) {
    var list = this.state.polylines.filter(line => line.key !== key)
    this.updatePolylines(list)
  }

  setPolylineStyle(line, stroke) {
    line.stroke = stroke
    this.updatePolylines(this.state.polylines)
  }

  getLineProps(){
    var color = parseHSV(this.hue, 1, 1)
    this.hue += 0.35
    this.hue -= Math.floor(this.hue)
    this.cnt += 1
    var key = this.cnt
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

  onImport(lines) {
    console.log("import", lines)
    lines.forEach((line, i) => {
      var obj = this.getLineProps()
      obj.points = line
      this.state.polylines.push(obj)
    })
    this.updatePolylines(this.state.polylines)
  }

  render() {
    return (
      <div>
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
                        className={`polyline-frame${(this.state.edit_line && this.state.edit_line.key === polyline.key) ? " edit" : ""}`}>
                        <td>
                          <input
                            className="toggle-visible"
                            id={`toggle-${polyline.key}`}
                            type="checkbox"
                            checked={polyline.visible}
                            onChange={this.onPolylineVisibleChanged.bind(this, polyline)}
                          />
                        </td>
                        <td>
                          <div className="polyline-color" 
                          style={{ backgroundColor: polyline.color }}></div>
                        </td>
                        <td>
                          <div className="polyline-name"
                            onClick={this.setEditLine.bind(this, polyline)}>
                            {polyline.name}
                          </div>
                        </td>
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
                                    src={img_close}
                                    alt="close dialog"
                                    className="action-button close"
                                    onClick={this.closeSetting.bind(this, polyline)} />
                                  <p>表示設定</p>
                                  <div className="setting-row">
                                    <label>
                                      <input type="radio"
                                        value="stroke"
                                        checked={polyline.stroke}
                                        onChange={this.setPolylineStyle.bind(this, polyline, true)} />
                                        線でつなぐ
                                    </label>
                                    <div className="style-preview" style={{
                                      backgroundColor: polyline.color,
                                      width: "50px",
                                      height: "6px",
                                      margin: "auto",
                                    }} />
                                  </div>
                                  <div className="setting-row">
                                    <label>
                                      <input type="radio"
                                        value="marker"
                                        checked={!polyline.stroke}
                                        onChange={this.setPolylineStyle.bind(this, polyline, false)} />
                                        マーカーのみ
                                    </label>
                                    <div className="style-preview">
                                      <img
                                        alt="preview"
                                        src={`https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${polyline.color.slice(1)}`} />
                                    </div>

                                  </div>

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
      <Map
        polylines={this.state.polylines}
        edit={this.state.edit_line}
        onUpdate={this.updatePolylines.bind(this)}
        onAdd={this.getLineProps.bind(this)}/>
      </div>
    )
  }
}
