import {Card} from "react-bootstrap";
import {useState, useEffect} from "react";
import { CSSTransition } from 'react-transition-group';
import React from "react";
import State from "../state";
import * as SchemaUtils from "../helpers/schema-utils";

interface BaseCardProps {
    header: string,
    title: string,
    profile?: string,
    wait?: number,
    content?: JSX.Element,
    clickable?: boolean
    link?: string
}

export const BaseCard = (props: BaseCardProps) => {
    let [show, setShow] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setShow(true);
        }, props.wait);
      }, [props.wait]);


    let index = props.header.indexOf("activity");
    let header = index >= 0 && props.header.length > "ActivityDefinition".length 
        ? props.header.slice(0, index) : props.header;
    if (header.length > 24) {
        header = header.slice(0,21) + "...";
    }
    index = props.title.indexOf("Activity");
    let title = index >= 0 ? props.title.slice(0, index) : props.title;
    if (title.startsWith("CPG")) title = title.slice(3);
    if (title.length > 22) {
        title = title.slice(0,19) + "...";
    }
    const content = props.content;
    let headerPadding = {};
    if (title == "") headerPadding = {padding:"7px"};
    const isActivity = index >= 0;
    
    return (
        <CSSTransition
        in={show}
        timeout={9999}
        classNames="res-card"
        >
        <Card
                onClick={(e: any) => {
                    if (e.target.tagName !== "svg" && e.target.tagName !== "path" && props.clickable) {
                    setShow(false);
                    setTimeout(() => {
                        if (State.get().bundle) {
	                        State.emit("save_changes_to_bundle_json");
                            State.get().bundle.set("pos", State.get().bundle.resources.length-1);
                            State.get().ui.set("openMode", "insert");
                        }
                        let json = {resourceType: "Bundle", entry: [{resource: {resourceType: "ActivityDefinition"}}, {resource: {resourceType: "PlanDefinition"}}]};
                        //const resourceProfile = SchemaUtils.getProfileOfResource(State.get().profiles, resourceJson);
                        (json.entry[0].resource as any).meta = {
                            profile: [props.profile]
                        };
                        State.emit("load_json_resource", json);
                        // State.emit("save_changes_to_bundle_json");
                        // State.get().ui.set("openMode", "insert");
                        // json = {resourceType: "Bundle", entry: [{resource: {resourceType: "PlanDefinition"}}]};
                        // (json.entry[0].resource as any).action = {
                        //     definitionCanonical: `http://fhir.org/guides/${State.get().publisher}/ActivityDefinition/ActivityDefinition-${State.get().CPGName}${State.get().resCount}`
                        // };
                        // State.emit("load_json_resource", json);
                        // State.get().bundle.set("pos", State.get().bundle.pos-1);
                    }, 350)
                    }
                }}
                >
                <Card.Header as="h6" style={headerPadding}>
                    {header}
                </Card.Header>
                <Card.Body>
                    <Card.Title as="h6">{title}</Card.Title>
                    <Card.Text as="div">
                        {content}
                    </Card.Text>
                </Card.Body>
                </Card>
        </CSSTransition>
    );
}