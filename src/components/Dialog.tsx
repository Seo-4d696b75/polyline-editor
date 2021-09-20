import React from 'react';
import './Dialog.css';
import { Modal, Button, Form, Col, DropdownButton, Dropdown, FormControl, FormLabel, Row, FormGroup } from 'react-bootstrap';
import * as Action from '../script/Actions'
import { Polyline } from "../script/types"
import { GlobalState, ImportModalProps, ExportModalProps, ModalType } from '../script/Reducer'
import { connect } from "react-redux"

type FormControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function mapState2Props(state: GlobalState): DialogProps {
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
  valid_format: boolean
  invalid_text: boolean
  digit: number
  points: Polyline | null
  validated: boolean
}


class Dialog extends React.Component<DialogProps, DialogState> {

  state: DialogState = {
    format: "$<lat>,$<lng>",
    text: "",
    invalid_format: false,
    valid_format: false,
    invalid_text: false,
    digit: 5,
    points: null,
    validated: false,
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
    if (!this.props.dialog) return null
    switch (this.props.dialog.type) {
      case ModalType.Import: {
        return (
          <Form validated={this.state.validated}>
            <FormGroup>
              <FormLabel>座標のフォーマット</FormLabel>
              <Row>
                <Col xs={8}>
                  <FormGroup>
                    <FormControl
                      as="textarea"
                      rows={1}
                      value={this.state.format}
                      onChange={setFormat}
                      isInvalid={this.state.invalid_format}
                      isValid={this.state.valid_format} />
                    <FormControl.Feedback type="invalid">
                      <div className="invalid-format-message">{"緯度\"$<lat>\",経度\"$<lng>\"を含む必要があります"}</div>
                    </FormControl.Feedback>
                  </FormGroup>
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
            </FormGroup>
            <FormGroup controlId="data">
              <FormLabel>座標データ</FormLabel>
              <FormControl
                as="textarea"
                rows={12}
                size="sm"
                required={true}
                placeholder="１行ごとにひとつ座標を読み出します"
                onChange={setText}
                isInvalid={this.state.invalid_text}
                ref={(c: HTMLTextAreaElement | null) => {
                  if (c && !this.focus_ref) {
                    this.focus_ref = c
                    setTimeout(() => {
                      c.focus()
                    }, 100);
                  }
                }} />
              <FormControl.Feedback type="invalid">
                <div className="invalid">有効なデータが見つかりません</div>
              </FormControl.Feedback>
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
                <FormGroup>
                  <FormControl
                    as="textarea"
                    rows={1}
                    value={this.state.format}
                    onChange={setFormat}
                    isInvalid={this.state.invalid_format}
                    isValid={this.state.valid_format} />
                  <FormControl.Feedback type="invalid">
                    <div className="invalid-format-message">{"緯度\"$<lat>\",経度\"$<lng>\"を含む必要があります"}</div>
                  </FormControl.Feedback>
                </FormGroup>
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
                value={this.state.text}
                placeholder="１行ごとにひとつ座標を書き出します" />
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
    this.setState({
      ...this.state,
      text: "",
      invalid_format: false,
      invalid_text: false,
      valid_format: false,
    })
    Action.closeDialog()
    this.focus_ref = null
  }

  submit() {
    const format = this.state.format
    var match = format.match(/\$<(lat|lng)>/g)
    if (match && match.length === 2 && match[0] !== match[1]) {
      switch (this.props?.dialog?.type) {
        case ModalType.Import: {
          this.importPolyline(format, this.state.text)
          break
        }
        case ModalType.Export: {
          this.exportPolyline(format, this.props.dialog.value)
          break
        }
        default:
      }
      return
    }
    this.setState({
      ...this.state,
      invalid_format: true,
      invalid_text: false,
    })
  }

  importPolyline(format: string, text: string) {
    format = format.replace(/\$<lat>/, '(?<lat>[0-9\\.]+)')
    format = format.replace(/\$<lng>/, '(?<lng>[0-9\\.]+)')
    var lines: Array<Polyline> = []
    var points: Polyline = []
    text.split(/\n/).forEach(line => {
      var regex = new RegExp(format, 'g')
      while (true) {
        var match = regex.exec(line)
        if (!match) {
          if (points.length > 0) {
            lines.push(points)
            points = []
          }
          break
        }
        if (match.groups) {
          var lat = parseFloat(match.groups.lat)
          var lng = parseFloat(match.groups.lng)
          if (lat > -90 && lat < 90 && lng >= -180 && lng <= 180) {
            points.push({ lat: lat, lng: lng })
            break
          }
        }
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
        invalid_format: false,
        valid_format: true,
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
        invalid_format: false,
        valid_format: true
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