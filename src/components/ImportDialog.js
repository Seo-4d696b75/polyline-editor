import React from 'react';
import './Dialog.css';
import {Form, Button} from "react-bootstrap";

export default class ImportDialog extends React.Component {

  constructor(){
    super()
    this.state = {
      show: false,
      type: null,
      data: null,
    }
  }
	
	render(){
		return (
			<div className="dialog-content import">
        <Form>
          <Form.Group controlId="format">
            <Form.Label>座標のフォーマット</Form.Label>
            <Form.Control type="text" defaultValue="${lat},${lng}"/>
          </Form.Group>
          <Form.Group controlId="data">
            <Form.Label>座標データ</Form.Label>
            <Form.Control type="text" htmlSize={20}/>
          </Form.Group>
          <Button variant="primary" type="submit">Import</Button>
        </Form>
			</div>
		)
	}
}
