import React from 'react';
import './Dialog.css';
import Data from "../script/DataStore";
import { Modal, Button, Form } from 'react-bootstrap';
import * as Action from '../script/Actions'

export default class Dialog extends React.Component {

  constructor() {
    super()
    this.state = {
      show: false,
      type: null,
      data: null,
      format: "${lat},${lng}",
      text: "",
      invalid_format: false,
      invalid_text: false,

    }
  }

  componentDidMount() {
    Data.on("onImportRequested", this.showDialog.bind(this, "Import"))
    Data.on("onExportRequested", this.showDialog.bind(this, "Export"))
  }

  componentWillUnmount() {
    Data.removeAllListeners("onImportRequested")
    Data.removeAllListeners("onExportRequested")
  }

  showDialog(type, value) {
    console.log("show dialog", type, value)
    this.setState(Object.assign({}, this.state, {
      show: true,
      type: type,
      data: value,
    }));
  }

  renderDialog() {
    switch (this.state.type) {
      case "Import": {
        const setText = (event) => {
          this.setState(Object.assign({}, this.state, {
            text: event.target.value
          }))
        } 
        const setFormat = (event) => {
          this.setState(Object.assign({}, this.state, {
            format: event.target.value
          }))
        }
        return (
          <Form>
            <Form.Group controlId="format">
              <Form.Label>座標のフォーマット</Form.Label>
              <Form.Control 
                as="textarea" 
                rows="1" 
                defaultValue="${lat},${lng}"
                onChange={setFormat} />
              {this.state.invalid_format ? <div className="invalid">{"緯度${lat}・経度${lng}を表すフォーマットを指定してください"}</div> : null}
            </Form.Group>
            <Form.Group controlId="data">
              <Form.Label>座標データ</Form.Label>
              <Form.Control 
                as="textarea" 
                rows="20" 
                size="sm"
                onChange={setText} />
              {this.state.invalid_text ? <div className="invalid">有効なデータが見つかりません</div> : null}
            </Form.Group>
            
          </Form>
        )
      }
      case "Export": {
        return null
      }
      default: {
        return null
      }
    }
  }

  closeModal() {
    this.setState(Object.assign({}, this.state, {
      show: false,
    }))
  }

  submitImport() {
    const format = this.state.format
    const text = this.state.text
    var match = format.match(/\$\{(.+?)\}/g) 
    if (match && match.length === 2 ){
      if ( match[0] ===  "${lat}" && match[1] === "${lng}"){
        this.importPolyline(format, text, false)
        return
      } else if ( match[0] === "${lng}" && match[1] === "${lat}" ){
        this.importPolyline(format, text, true)
        return
      }
    }
    this.setState(Object.assign({}, this.state, {
      invalid_format: true,
    }))
  }

  importPolyline(format, text, invert){
    format = format.replace(/\(/g, '\\\\(')
    format = format.replace(/\)/g, '\\\\)')
    format = format.replace(/\$\{(lat|lng)\}/g, '([0-9\.]+)')
    const pattern = new RegExp(format, '')
    var lines = []
    var points = []
    text.split(/\n/).forEach( line => {
      var match = line.match(pattern)
      if (match){
        var lat = parseFloat(match[1])
        var lng = parseFloat(match[2])
        if ( invert ){
          [lat, lng] = [lng, lat]
        }
        points.push({lat:lat, lng:lng})
      } else if ( points.length > 0 ){
        lines.push(points)
        points = []
      }
    })
    if ( points.length > 0 ){
      lines.push(points)
    }
    if ( lines.length > 0 ){
      Action.importPolyline(lines)
      this.closeModal()
    } else {
      this.setState(Object.assign({}, this.state, {
        invalid_text: true,
      }))
    }
  }

  render() {
    return (
      <div>
        <Modal show={this.state.show} onHide={this.closeModal.bind(this)} centered id="edit">
          <Modal.Body className="modal-body">
            {this.renderDialog()}
          </Modal.Body>
          <Modal.Footer className="modal-footer">
            
          <Button
              variant="secondary"
              onClick={this.closeModal.bind(this)}>
              Cancel
              </Button>
            <Button
              variant="primary"
              type="submit"
              onClick={this.submitImport.bind(this)}>
                {this.state.type}
              </Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}
