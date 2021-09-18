import React, { FormEvent } from 'react';
import './Dialog.css';
import { Modal, Button, Form, Col, DropdownButton, Dropdown, FormControl, FormLabel, Row, FormGroup } from 'react-bootstrap';
import * as Action from '../script/Actions'
import { Polyline } from "../script/types"
import { GlobalState, ImportModalProps, ExportModalProps, ModalType } from '../script/Reducer'
import { connect } from "react-redux"

type FormControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function mapState2Props(state: GlobalState): DialogProps{
  return {
    dialog: state.modal
  }
}

interface DialogProps {
  dialog: ImportModalProps | ExportModalProps | null
}

interface DialogState {
  format: string
  text: string
  invalid_format: boolean
  invalid_text: boolean
  digit: number
  points: Polyline | null
}


class Dialog extends React.Component<DialogProps, DialogState> {

  state: DialogState = {
    format: "$<lat>,$<lng>",
    text: "",
    invalid_format: false,
    invalid_text: false,
    digit: 5,
    points: null,
  }

  focus_ref: HTMLTextAreaElement | null = null

  renderDialog() {
    const setText = (event: React.ChangeEvent<FormControlElement>) => {
      this.setState({
        ...this.state,
        text: event.target.value
      })
    }
    const setFormat = (event: React.ChangeEvent<FormControlElement>) => {
      this.setState({
        ...this.state,
        format: event.target.value
      })
    }
    const selectFormat = (eventKey: string | null, e: React.SyntheticEvent<unknown>) => {
      this.setState({
        ...this.state,
        format: eventKey ? eventKey : ""
      })
    }
    const setDigit = (event: React.ChangeEvent<FormControlElement>) => {
      this.setState({
        ...this.state,
        digit: parseInt(event.target.value),
      })
    }
    const copy = (event: any) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(this.state.text)
      }
    }
    if (!this.props.dialog ) return null
    switch (this.props.dialog.type) {
      case ModalType.Import: {
        return (
          <Form>
            <FormLabel>座標のフォーマット</FormLabel>
            <Row>
              <Col xs={8}>
                <FormControl
                  as="textarea"
                  rows={1}
                  value={this.state.format}
                  onChange={setFormat} />
              </Col>
              <Col xs={2}>
                <DropdownButton
                  id="import-format-template"
                  variant="outline-primary"
                  title="テンプレート"
                  onSelect={selectFormat}>
                  <Dropdown.Item eventKey="$<lat>,$<lng>">CSV (lat,lng)</Dropdown.Item>
                  <Dropdown.Item eventKey="$<lng>,$<lat>">CSV (lng,lat)</Dropdown.Item>
                  <Dropdown.Item eventKey={'"lat":$<lat>,.?"lng":$<lng>'}>JSON (lat/lng)</Dropdown.Item>
                  <Dropdown.Item eventKey={'"lng":$<lng>,.?"lat":$<lat>'}>JSON (lng/lat)</Dropdown.Item>
                </DropdownButton>
              </Col>
            </Row>
            <div className="invalid">{this.state.invalid_format ? "緯度$<lat>・経度$<lng>を表すフォーマットを指定してください" : null}</div>
            <FormGroup controlId="data">
              <FormLabel>座標データ</FormLabel>
              <FormControl
                as="textarea"
                rows={12}
                size="sm"
                onChange={setText}
                ref={(c: HTMLTextAreaElement | null) => {
                  if (c) {
                    setTimeout(() => {
                      c.focus()
                    }, 100);
                  }
                }} />
              {this.state.invalid_text ? <div className="invalid">有効なデータが見つかりません</div> : null}
            </FormGroup>

          </Form>
        )
      }
      case ModalType.Export: {
        return (
          <Form>
            <FormLabel>座標のフォーマット</FormLabel>
            <Row>
              <Col xs={8}>
                <FormControl
                  as="textarea"
                  rows={1}
                  value={this.state.format}
                  onChange={setFormat} />
              </Col>
              <Col xs={2}>
                <DropdownButton
                  id="export-format-template"
                  title="テンプレート"
                  variant="outline-primary"
                  onSelect={selectFormat}>
                  <Dropdown.Item eventKey="$<lat>,$<lng>">CSV (lat,lng)</Dropdown.Item>
                  <Dropdown.Item eventKey="$<lng>,$<lat>">CSV (lng,lat)</Dropdown.Item>
                  <Dropdown.Item eventKey={'{"lat":$<lat>,"lng":$<lng>},'}>JSON (lat/lng)</Dropdown.Item>
                  <Dropdown.Item eventKey={'{"lng":$<lng>,"lat":$<lat>},'}>JSON (lng/lat)</Dropdown.Item>
                </DropdownButton>
              </Col>
            </Row>
            <div className="invalid">{this.state.invalid_format ? "緯度$<lat>・経度$<lng>を表すフォーマットを指定してください" : null}</div>
            <Row>
              <Col xs={6}>
                <FormLabel>座標値の小数点以下桁数 : <strong>{this.state.digit}</strong></FormLabel>
                <FormControl
                  type="range"
                  min="0"
                  max="10"
                  defaultValue={this.state.digit}
                  onChange={setDigit} />
              </Col>
              <Col xs={2}>
                <Button
                  variant="primary"
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
            </Row>
            <FormGroup controlId="data">
              <FormControl
                as="textarea"
                rows={12}
                size="sm"
                readOnly
                value={this.state.text} />
            </FormGroup>

          </Form>
        )
      }
      default: {
        return null
      }
    }
  }

  closeModal() {
    Action.closeDialog()
  }

  submit() {
    const format = this.state.format
    var match = format.match(/\$<(.+?)>/g)
    if (match && match.length === 2) {
      var checked = false
      if (match[0] === "$<lat>" && match[1] === "$<lng>") {
        checked = true
      } else if (match[0] === "$<lng>" && match[1] === "$<lat>") {
        checked = true
      }
      if (checked) {
        switch (this.props?.dialog?.type ) {
          case ModalType.Import: {
            this.importPolyline(format, this.state.text)
            break
          }
          case ModalType.Export: {
            this.exportPolyline(format, this.state.points)
            break
          }
          default:
        }
        return
      }
    }
    this.setState({
      ...this.state,
      invalid_format: true,
    })
  }

  importPolyline(format: string, text: string) {
    format = format.replace(/\$<lat>/, '(?<lat>[0-9\\.]+)')
    format = format.replace(/\$<lng>/, '(?<lng>[0-9\\.]+)')
    var lines: Array<Polyline> = []
    var points: Polyline = []
    text.split(/\n/).forEach(line => {
      var regex = new RegExp(format, 'g')
      var cnt = 0
      while (true) {
        var match = regex.exec(line)
        if (!match) break
        if (match.groups) {
          var lat = parseFloat(match.groups.lat)
          var lng = parseFloat(match.groups.lng)
          if (lat > -90 && lat < 90 && lng >= -180 && lng <= 180) {
            points.push({ lat: lat, lng: lng })
            cnt += 1
          }
        }
      }
      if (cnt === 0 && points.length > 0) {
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
      this.setState({
        ...this.state,
        invalid_text: true,
      })
    }
  }

  exportPolyline(format: string, points: Polyline | null) {
    const digit = this.state.digit
    if (points) {
      var text = points.map(p => {
        var line = format
        line = line.replace("$<lat>", p.lat.toFixed(digit))
        line = line.replace("$<lng>", p.lng.toFixed(digit))
        return line
      }).join("\n")
      this.setState({
        ...this.state,
        text: text,
      })
    }
  }

  render() {
    return (
      <div>
        <Modal show={this.props.dialog !== null} onHide={this.closeModal.bind(this)} id="edit">
          <Modal.Body className="modal-body">
            {this.renderDialog()}
          </Modal.Body>
          <Modal.Footer className="modal-footer">

            <Button
              variant="secondary"
              onClick={this.closeModal.bind(this)}>
              Close
              </Button>
            {this.props.dialog?.type === ModalType.Import ? (
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

export default connect(mapState2Props)(Dialog)