import React from 'react';
import ReactDOM from 'react-dom';
import './Dialog.css';
import Data from "../script/DataStore";
import { Modal, Button, Form, Col, Dropdown, DropdownButton } from 'react-bootstrap';
import * as Action from '../script/Actions'

export default class Dialog extends React.Component {

  constructor() {
    super()
    this.state = {
      show: false,
      type: null,
      points: null,
      format: "$<lat>,$<lng>",
      text: "",
      invalid_format: false,
      invalid_text: false,
      digit: 5,
    }
    this.focus_ref = React.createRef()
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
      points: value,
      text: "",
      invalid_format: false,
      invalid_text: false,
    }));
    this.focus_ref = null
    setTimeout(() => {
      if (this.focus_ref) {
        ReactDOM.findDOMNode(this.focus_ref).focus()
      }
    }, 100);
  }

  renderDialog() {
    const setText = (event) => {
      this.setState(Object.assign({}, this.state, {
        text: event.target.value
      }))
    }
    const setFormat = (arg) => {
      var value = (typeof arg === "string") ? arg : arg.target.value
      this.setState(Object.assign({}, this.state, {
        format: value
      }))
    }
    const setDigit = (event) => {
      this.setState(Object.assign({}, this.state, {
        digit: event.target.value
      }))
    }
    const copy = (event) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(this.state.text)
      }
    }
    switch (this.state.type) {
      case "Import": {
        return (
          <Form>
            <Form.Label>座標のフォーマット</Form.Label>
            <Form.Row>
              <Col xs={8}>
                <Form.Control
                  as="textarea"
                  rows="1"
                  value={this.state.format}
                  onChange={setFormat} />
              </Col>
              <Col xs={2}>
                <DropdownButton
                  title="テンプレート"
                  variant="outline-primary"
                  onSelect={setFormat}>
                  <Dropdown.Item eventKey="$<lat>,$<lng>">CSV (lat,lng)</Dropdown.Item>
                  <Dropdown.Item eventKey="$<lng>,$<lat>">CSV (lng,lat)</Dropdown.Item>
                  <Dropdown.Item eventKey={'"lat":$<lat>,.?"lng":$<lng>'}>JSON (lat/lng)</Dropdown.Item>
                  <Dropdown.Item eventKey={'"lng":$<lng>,.?"lat":$<lat>'}>JSON (lng/lat)</Dropdown.Item>
                </DropdownButton>
              </Col>
            </Form.Row>
            <div className="invalid">{this.state.invalid_format ? "緯度$<lat>・経度$<lng>を表すフォーマットを指定してください" : null}</div>
            <Form.Group controlId="data">
              <Form.Label>座標データ</Form.Label>
              <Form.Control
                as="textarea"
                rows="20"
                size="sm"
                onChange={setText}
                ref={c => this.focus_ref = c} />
              {this.state.invalid_text ? <div className="invalid">有効なデータが見つかりません</div> : null}
            </Form.Group>

          </Form>
        )
      }
      case "Export": {
        return (
          <Form>
            <Form.Label>座標のフォーマット</Form.Label>
            <Form.Row>
              <Col xs={8}>
                <Form.Control
                  as="textarea"
                  rows="1"
                  value={this.state.format}
                  onChange={setFormat} />
              </Col>
              <Col xs={2}>
                <DropdownButton
                  title="テンプレート"
                  variant="outline-primary"
                  onSelect={setFormat}>
                  <Dropdown.Item eventKey="$<lat>,$<lng>">CSV (lat,lng)</Dropdown.Item>
                  <Dropdown.Item eventKey="$<lng>,$<lat>">CSV (lng,lat)</Dropdown.Item>
                  <Dropdown.Item eventKey={'{"lat":$<lat>,"lng":$<lng>},'}>JSON (lat/lng)</Dropdown.Item>
                  <Dropdown.Item eventKey={'{"lng":$<lng>,"lat":$<lat>},'}>JSON (lng/lat)</Dropdown.Item>
                </DropdownButton>
              </Col>
            </Form.Row>
            <div className="invalid">{this.state.invalid_format ? "緯度$<lat>・経度$<lng>を表すフォーマットを指定してください" : null}</div>
            <Form.Row>
              <Form.Group as={Col} controlId="digit" xs={6}>
                <Form.Label>座標値の小数点以下桁数 : <strong>{this.state.digit}</strong></Form.Label>
                <Form.Control
                  type="range"
                  min="0"
                  max="10"
                  defaultValue={this.state.digit}
                  onChange={setDigit}
                  tooltip='on' />
              </Form.Group>
              <Col xs={2}>
                <Button
                  variant="primary"
                  type="submit"
                  onClick={this.submit.bind(this)}>
                  Export
                  </Button>
              </Col>
              <Col xs={2}>
                <Button
                  variant="outline-primary"
                  onClick={copy}>
                  Copy
                  </Button>
              </Col>
            </Form.Row>
            <Form.Group controlId="data">
              <Form.Control
                as="textarea"
                rows="20"
                size="sm"
                readOnly
                value={this.state.text} />
            </Form.Group>

          </Form>
        )
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

  submit() {
    const format = this.state.format
    var match = format.match(/\$<(.+?)>/g)
    if (match && match.length === 2) {
      var invert = null
      if (match[0] === "$<lat>" && match[1] === "$<lng>") {
        invert = false
      } else if (match[0] === "$<lng>" && match[1] === "$<lat>") {
        invert = true
      }
      if (invert !== null) {
        switch (this.state.type) {
          case "Import": {
            this.importPolyline(format, this.state.text, invert)
            break
          }
          case "Export": {
            this.exportPolyline(format)
            break
          }
          default:
        }
        return
      }
    }
    this.setState(Object.assign({}, this.state, {
      invalid_format: true,
    }))
  }

  importPolyline(format, text) {
    format = format.replace(/\$<lat>/, '(?<lat>[0-9\\.]+)')
    format = format.replace(/\$<lng>/, '(?<lng>[0-9\\.]+)')
    var lines = []
    var points = []
    text.split(/\n/).forEach(line => {
      var regex = new RegExp(format, 'g')
      var point = null
      var match = null
      while((match = regex.exec(line)) !== null ){
        var lat = parseFloat(match.groups.lat)
        var lng = parseFloat(match.groups.lng)
        if ( lat > -90 && lat < 90 && lng >= -180 && lng <= 180 ){
          point = { lat: lat, lng: lng }
          break
        }
      }
      if (point) {
        points.push(point)
      } else if (points.length > 0) {
        lines.push(points)
        points = []
      }
    })
    if (points.length > 0) {
      lines.push(points)
    }
    if (lines.length > 0) {
      Action.importPolyline(lines)
      this.closeModal()
    } else {
      this.setState(Object.assign({}, this.state, {
        invalid_text: true,
      }))
    }
  }

  exportPolyline(format) {
    const digit = this.state.digit
    var text = this.state.points.map(p => {
      var line = format
      line = line.replace("$<lat>", p.lat.toFixed(digit))
      line = line.replace("$<lng>", p.lng.toFixed(digit))
      return line
    }).join("\n")
    this.setState(Object.assign({}, this.state, {
      text: text,
    }))
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
              Close
              </Button>
            {this.state.type === "Import" ? (
              <Button
                variant="primary"
                type="submit"
                onClick={this.submit.bind(this)}>
                Import
              </Button>
            ) : null}
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}
