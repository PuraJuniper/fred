import React, { FormEvent, useEffect, useState } from "react";
import { Form, Row , Col} from 'react-bootstrap';
import State from "../state";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCaretRight, faCaretLeft} from  '@fortawesome/pro-solid-svg-icons';
import * as SchemaUtils from "../helpers/schema-utils"
import { getExpressionsFromLibraries } from "./conditionBuilder";
import { Expression, PlanDefinitionActionCondition } from "fhir/r4";

interface SimpleFormProps {
    actNode: SchemaUtils.SageNodeInitialized,
    planNode: SchemaUtils.SageNodeInitialized,
}

export const SimpleForm = (props:SimpleFormProps) => {
    const state = State.get();
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [condition, setCondition] = useState<PlanDefinitionActionCondition>();
    let [availableExpressions, setAvailableExpressions] = useState<Expression[]>([]);

    const handleSubmit = function() {
        console.log(name);
        console.log(description);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, "name"), name, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "name"), name, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, "description"), description, false);
        State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "description"), description, false);
        const actionNode = SchemaUtils.getChildOfNode(props.planNode, "action")
        if (actionNode) {
            const actionNodes = SchemaUtils.getChildrenFromObjectArrayNode(actionNode);
            console.log(actionNodes);
            if (actionNodes) {
                State.emit("value_change", SchemaUtils.getChildOfNode(actionNodes[0], "title"), name, false);
                State.emit("value_change", SchemaUtils.getChildOfNode(actionNodes[0], "description"), description, false);
                if (condition) {
                    const conditionNode = SchemaUtils.getChildOfNode(actionNodes[0], "condition");
                    if (conditionNode) {
                        const conditionNodes = SchemaUtils.getChildrenFromObjectArrayNode(conditionNode);
                        State.emit("load_json_into", conditionNodes[0], condition);
                    }
                }
            }
        }
        
        // State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, "condition"), condition, false);
        // State.emit("save_changes_to_bundle_json");
        // State.get().set("ui", {status:"collection"})
        // let elements = (document.getElementById("commonMetaDataForm") as HTMLFormElement).elements;
        // const titleElement = elements.namedItem('title');
        // const descriptionElement = elements.namedItem('description');
        // const conditionElement = elements.namedItem('condition');
        // console.log(conditionElement);
        // let obj:{ [key: string]: any } = {};
        // for(let i = 2 ; i < elements.length ; i++){
        //     let item = (elements.item(i) as HTMLInputElement);
        //     let value = item.value;
        //     console.log(item, value);
        //     State.emit("value_change", SchemaUtils.getChildOfNode(props.actNode, item.id), value, false);
        //     State.emit("value_change", SchemaUtils.getChildOfNode(props.planNode, item.id), value, false);
        // }
        // State.emit("save_changes_to_bundle_json");
        State.get().set("ui", {status:"collection"})
    }

    useEffect(
        () => {
            setAvailableExpressions((a) => [...a, ...getExpressionsFromLibraries()])
            return () => {}
        },
        [],
    );

    // const getExpressionsFromLibraries = () => {
	// 	const parsedLib = new cql.Library(test);
    //     const foundExpressions: Expression[] = [];
	// 	for (const expressionKey of Object.keys(parsedLib.expressions)) {
    //         foundExpressions.push({
    //             language: 'text/cql',
    //             expression: expressionKey
    //         });
	// 	}
    //     setAvailableExpressions([...availableExpressions, ...foundExpressions]);
    // }

    return (
        <div>
        <iframe name="void" style={{display:"none"}}></iframe>
        <Form style={{color:"#2a6b92"}} id="commonMetaDataForm" target="void" onSubmit={handleSubmit}>
        <button className="navigate-reverse col-lg-2 col-md-3" 
							disabled={state.bundle.resources.length <= 2}
							onClick={() => {
								State.emit("remove_from_bundle", state.bundle.pos + 1);
            					State.emit("remove_from_bundle", state.bundle.pos); 
								State.get().set("ui", {status:"cards"})
							}}>
							<FontAwesomeIcon icon={faCaretLeft} />
							&nbsp;Delete Resource
					</button>
					<button className="navigate col-lg-2 col-md-3" 
                            type="submit">
							Save Resource&nbsp;
							<FontAwesomeIcon icon={faCaretRight} />
					</button>
        <h3  style={{marginTop:"20px", marginBottom:"10px"}}><b>PlanDefinition/ActivityDefinition</b></h3>
            <Row className="mb-2">
                <Form.Group as= {Col} controlId="title">
                    <Form.Label as="b">Title</Form.Label>
                    <Form.Control 
                        type="text"
                        defaultValue={(SchemaUtils.getChildOfNode(props.actNode, "title"))?.value}
                        onChange={(e) => setName(e.currentTarget.value)}
                    />
                </Form.Group>
            </Row>
            <Row className="mb-2">
                <Form.Group as= {Col} controlId="description">
                    <Form.Label as="b">Description</Form.Label>
                    <Form.Control 
                        type="text"
                        defaultValue={(SchemaUtils.getChildOfNode(props.actNode, "description"))?.value}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                    />
                </Form.Group>
            </Row>
            <Row className="mb-2">
                <Form.Group as= {Col} controlId="condition">
                    <Form.Label as="b">Condition</Form.Label>
                    <Form.Control as="select" aria-label="Default select example" 
                    onChange={(e) => {
                        console.log(e.currentTarget.value);
                        setCondition({
                            expression: {
                                language: 'text/cql',
                                expression: e.currentTarget.value
                            },
                            kind: 'applicability'
                        })
                    }}>
                        <option key="" value="">None</option>
                        {availableExpressions.map((v) => {
                            return <option key={v.expression} value={v.expression}>{v.expression}</option>
                        })}
                    </Form.Control>
                </Form.Group>
            </Row>
        </Form>
        </div>
    )
}