import { faCaretLeft, faCaretRight } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PlanDefinitionActionCondition } from 'fhir/r4';
import React from "react";
import State, { SageNodeInitializedFreezerNode } from '../state';

import { ICardForm, CardEditor } from './cardEditor';
import { FriendlyResourceProps } from './nameHelpers';
import { Card } from "react-bootstrap";

export type cardRow = string[];
export type cardLayout = {
    cardColumns: cardRow[];
}
export enum ElemType {
    TextBox,
    Dropdown
}
export type textBoxProps = {
    boxSize: number;
    isReadOnly: boolean;
    isLink: boolean;
    caption: string;
}
export interface CardFormState {
    step: number;
}

export type CardFormProps = {
    sageNode: SageNodeInitializedFreezerNode,
    fieldHandlers: any[][],
    resourceType: FriendlyResourceProps,
    elementList: JSX.Element[],
    displayList: JSX.Element[],
    pdConditions: PlanDefinitionActionCondition[],
    innerCardForm: ICardForm,
    handleSaveResource: ()=> void,
}
export class OuterCardForm extends React.Component<CardFormProps, CardFormState>{
    sageState: any;
    cardHeader: JSX.Element;
    saveButton: JSX.Element;
    deleteCardButton: JSX.Element;
    pageTitles: Map<number, string>;

    constructor(props: CardFormProps) {
        super(props);
        this.cardHeader =
            <h3 key="cardName" style={{ marginTop: "20px", marginBottom: "10px" }}><b>
                {this.props.resourceType ? this.props.resourceType?.FRIENDLY ?? "Unknown Resource Type" : ""}
            </b></h3>;

        this.saveButton =
            <button key="butSave" className="navigate col-lg-2 col-md-3"
                type="button"
                onClick={()=> this.props.handleSaveResource()}>
                Save Card&nbsp;
                <FontAwesomeIcon key="butSaveIcon" icon={faCaretRight} />
            </button>;

        this.deleteCardButton =
            <button key="butDel" type='button' className="navigate col-lg-2 col-md-3"
                onClick={() => {
                    State.emit("remove_from_bundle", State.get().bundle.pos + 1);
                    State.emit("remove_from_bundle", State.get().bundle.pos);
                    State.get().set("ui", { status: "cards" });
                    this.resetForm();
                }}>
                Cancel
            </button>;


        this.state = {
            step: 1
        };

        this.pageTitles = new Map([
            [1, "Page 1: Filling in the basics"],
            [2, "Page 2: Adding Conditions"],
            [3, "Page 3: Card Preview"]
        ])

    }

    leftNavButton = () => {
        return (
            <button type='button' className={"navigate-reverse col-lg-2 col-md-3"}
                onClick={() => this.setState({ step: this.state.step - 1 })}>
                {<> <FontAwesomeIcon icon={faCaretLeft} /> {" Previous"} </>}
            </button>);
    }

    rightNavButton = () => {
        return (
            <button type='button' className={"navigate col-lg-2 col-md-3"}
                onClick={() => this.setState({ step: this.state.step + 1 })}>
                {<> {"Next "} <FontAwesomeIcon icon={faCaretRight} /></>}
            </button>);
    }

    resetForm = () => { this.setState({ step: 1 }) }


    render() {
        const PageOne = this.props.innerCardForm.pageOne; // https://reactjs.org/docs/jsx-in-depth.html#choosing-the-type-at-runtime
        const PageTwo = this.props.innerCardForm.pageTwo;
        const PageThree = this.props.innerCardForm.pageThree;
        
        return (
            <div>
                <div className='basic-page-titles'>{this.pageTitles.get(this.state.step)}</div>
                <div>{this.state.step == 1 ? <PageOne fieldElements={this.props.elementList} /> : null}</div>
                {this.state.step == 2 ? <PageTwo conditions={this.props.pdConditions}/> : null}
                {this.state.step == 3 ? <Card style={{ padding: "20px", margin: "10px", borderWidth: "2px", borderColor:'rgb(42, 107, 146)', borderRadius: '40px'}}>
                                        <Card.Title>{this.props.resourceType.FRIENDLY}</Card.Title>
                                        <Card.Body><PageThree displayElements={this.props.displayList}/></Card.Body>
                                        </Card> : null}
                <div><>
                    {this.state.step > 1 ? this.leftNavButton() : null}
                    {this.state.step <= 2 ? this.rightNavButton() : null}
                    {this.saveButton}
                    {this.deleteCardButton}
                </></div>
            </div>
        );
    }
}