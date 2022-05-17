import { faCaretLeft, faCaretRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from "react";
import State, { SageNodeInitializedFreezerNode } from '../state';

import { FieldHandlerProps, ICardForm } from './cardEditor';
import { FriendlyResourceProps, friendlyTimeUnit } from './nameHelpers';
import { Card, Col, Container, Nav, Row } from "react-bootstrap";
import { Progress, progressStep } from './topProgressBar';


export type cardRow = string[];
export type cardLayout = {
    cardColumns: cardRow[];
}

export const buttonSpacer = (button: JSX.Element | null) => <Col lg={{ span: 2, offset: 3 }} xs={{ span: 3, offset: 1 }}>{button}</Col>;

export enum ElemType {
    TextBox,
    Dropdown
}


export type previewProps = {
    className: string;
    displayFieldTitle: boolean;
    friendlyDisplay?: (value: string) => string; // Convert `value` to friendly name
}

export type fieldFormProps = {
    requiredFor?: string[];
    otherFieldTriggerFn?: (changedField: string, fieldValue: string, fieldHandlers: Map<string, FieldHandlerProps>, requiredField?: string) => string;
    preview?: previewProps

}

export type textBoxProps = fieldFormProps & {
    boxSize: number;
    isReadOnly: boolean;
    isLink: boolean;
    caption: string;
    className?: string;
    hideFieldTitle?: boolean;
    hideFieldToolTip?: boolean;
}

export type invisibleFieldProps = fieldFormProps

export type dropdownBoxProps = fieldFormProps & {
    values: () => string[];
    display?: (value: string) => string; // Returns a friendly name for `value` from `values`
}
export const timeUnitsDropdownProps = (values: string[]): dropdownBoxProps => {
    return {
        values: () => values, //['h', 'd', 'wk', 'mo', 'a'],
        display: v => `${friendlyTimeUnit(v)}(s)`,
        requiredFor: ["text"],
        preview: {
            className: "",
            displayFieldTitle: true,
            friendlyDisplay: v => `${friendlyTimeUnit(v)}(s)`
        }
    }
}

const activityPlanSteps: progressStep[] =
[
	{pageTitle: "What does the card do?",	  text: "Enter What the card does"},
	{pageTitle: "When is the card played?",	text: "Enter When the card is played"},
	{pageTitle: "Review card",	              text: "Review and Save"},
]

export interface CardFormState {
    step: number;
}

export type CardFormProps = {
    sageNode: SageNodeInitializedFreezerNode,
    fieldHandlers: Map<string, FieldHandlerProps>,
    resourceType: FriendlyResourceProps,
    elementList: JSX.Element[],
    previewList: JSX.Element[],
    conditionEditor: JSX.Element,
    innerCardForm: ICardForm,
    handleSaveResource: ()=> void,
    handleExit: () => void,
}
export class OuterCardForm extends React.Component<CardFormProps, CardFormState>{
    cardHeader: JSX.Element;
    saveButton: (callback: () => void) => JSX.Element;
    cancelButton: (callback: () => void) => JSX.Element;
    // pageTitles: Map<number, string>;

    constructor(props: CardFormProps) {
        super(props);
        this.cardHeader =
            <h3 key="cardName" style={{ marginTop: "20px", marginBottom: "10px" }}><b>
                {this.props.resourceType ? this.props.resourceType?.FRIENDLY ?? "Unknown Resource Type" : ""}
            </b></h3>;
            
        this.saveButton = (callback) =>
            <button className="navigate w-100"
                type="button"
                onClick={callback}>
                Save Card&nbsp;
                <FontAwesomeIcon key="butSaveIcon" icon={faCaretRight} />
            </button>;

        this.cancelButton = (callback) =>
        <button key="butCancel" type='button' className="navigate w-100"
                onClick={callback}>
                Cancel
            </button>;

        this.state = {
            step: 1,
        };

        // this.pageTitles = new Map([
        //     [1, "What does the card do?"],
        //     [2, "When is the card played?"],
        //     [3, "Review card"]
        // ])

    }

    leftNavButton = () => {
        return (
            <button type='button' className={"navigate-reverse w-100"}
                onClick={() => this.setState({ step: this.state.step - 1 })}>
                {<> <FontAwesomeIcon icon={faCaretLeft} /> {" Previous"} </>}
            </button>);
    }

    rightNavButton = () => {
        return (
            <button type='button' className={"navigate w-100"}
                onClick={() => this.setState({ step: this.state.step + 1 })}>
                {<> {"Next "} <FontAwesomeIcon icon={faCaretRight} /></>}
            </button>);
    }

    render() {
        const PageOne = this.props.innerCardForm.pageOne; // Variable name case matters (https://reactjs.org/docs/jsx-in-depth.html#choosing-the-type-at-runtime)
        const PageTwo = this.props.innerCardForm.pageTwo;
        const PageThree = this.props.innerCardForm.pageThree;
        return (
            <Container className="p-5">
                <Row>
                    <h4 id='page-title' className="col-12">{this.props.resourceType.FRIENDLY} Card</h4>
                </Row>
                <Row style={{ padding: "1px"}}>
                    <Col xs="12">
                        <Nav justify variant="tabs"
                            activeKey={this.state.step.toString()}
                            onSelect={(selectedKey) => {this.setState({ step: parseInt(selectedKey ?? "1") })}}
                            >
                            <Nav.Item>
                                <Nav.Link bsPrefix='left-nav-button btn btn-sage-white-secondary' eventKey="1">{activityPlanSteps[0].pageTitle}</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="2">{activityPlanSteps[1].pageTitle}</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="3">{activityPlanSteps[2].pageTitle}</Nav.Link>
                            </Nav.Item>
                    </Nav>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        {this.state.step == 1 ? <PageOne fieldElements={this.props.elementList} /> : null}
                        {this.state.step == 2 ? <PageTwo conditionEditor={this.props.conditionEditor} /> : null}
                        {this.state.step == 3 ? <Card style={{ padding: "20px", margin: "10px", borderWidth: "2px", borderColor:'#2D2E74', borderRadius: '40px'}}>
                                                <Card.Title>{this.props.resourceType.FRIENDLY}</Card.Title>
                                                <Card.Body><PageThree displayElements={this.props.previewList}/></Card.Body>
                                                </Card> : null}
                    </Col>
                </Row>
                <Row className="mt-5">
                    <Col lg="2" xs="3">
                        {this.cancelButton (() => {
                    this.setState({ step: 1 });
                    this.props.handleExit();
                })}
                    </Col>
                    {buttonSpacer(this.state.step > 1 ? this.leftNavButton() : null)}
                    {buttonSpacer(this.state.step <= 2 ? this.rightNavButton() : this.saveButton(this.props.handleSaveResource))}
                </Row>
            </Container>
        );
    }
}