import React from 'react';
import './Editor.css';
import Map, { MapProps } from "./Map"
import img_setting from "../img/ic_settings.png";
import img_delete from "../img/ic_trash.png";
import img_close from "../img/ic_delete.png";
import img_export from "../img/ic_upload.png";
import { CSSTransition } from "react-transition-group";
import * as Action from "../script/Actions";
import { Button } from "react-bootstrap";
import { PolylineProps } from "../script/types"
import { GlobalState } from "../script/Reducer";
import { connect } from 'react-redux';

function mapState2Props(state: GlobalState): MapProps {
  return {
    polylines: state.lines,
    target: state.target,
    focus: state.focus_map,
  }
}

class Editor extends React.Component<MapProps, {}> {

  onPolylineVisibleChanged(line: PolylineProps, event?: any) {
    var value = event.currentTarget.checked
    line.visible = value
    if (!value && this.props.target && this.props.target.key === line.key) {
      Action.setTarget(null)
    }
    Action.updateLines()
  }

  onPolylineSetting(line: PolylineProps, event?: any) {
    line.setting = true
    Action.updateLines()
  }


  setEditLine(line: PolylineProps) {
    line.visible = true
    Action.setTarget(line)
    Action.updateLines()
  }

  closeSetting(line: PolylineProps, event?: any) {
    line.setting = false
    Action.updateLines()
  }

  deletePolyline(key: number, event?: any) {
    var list = this.props.polylines.filter(line => line.key !== key)
    Action.updateLines(list)
  }

  setPolylineStyle(line: PolylineProps, stroke: boolean) {
    line.stroke = stroke
    line.setting = false
    Action.updateLines()
  }

  render() {
    return (
      <div>
        <div className="editor-container">
          <div className="editor-relative">
            <p className="panel-title">ポリライン一覧</p>
            {this.props.polylines.length === 0 ? (
              <div className="import-hint">表示するデータがありません</div>
            ) : (

              <div className="polyline-scroll">
                <table>
                  <tbody>
                    {this.props.polylines.map((polyline) => (
                      <tr key={polyline.key}
                        className={`polyline-frame${(this.props.target && this.props.target.key === polyline.key) ? " edit" : ""}`}>
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
                            alt="export"
                            onClick={() => Action.requestExport(polyline.points)}></img>
                        </td>
                        <td>
                          <img className="action-button delete"
                            src={img_delete}
                            alt="delete"
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
          polylines={this.props.polylines}
          target={this.props.target}
          focus={this.props.focus} />
      </div>
    )
  }
}

export default connect(mapState2Props)(Editor)