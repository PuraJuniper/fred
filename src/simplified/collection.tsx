import {useState, useEffect} from "react";
import {Folder} from"./folder";
import State from "../state";
import * as SchemaUtils from "../helpers/schema-utils"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faDownload, faCaretLeft} from  '@fortawesome/pro-solid-svg-icons';


const Collection = () => {

    const resources = State.get().bundle?.resources ?? [];

    return (
        <div style={{marginTop:"50px"}}>
            <div className="row">
            <h3 className="col-lg-10 col-md-9" style={{color:"#2a6b92"}}><b>Saved Cards</b></h3>
            <button className="navigate-reverse col-lg-2 col-md-3" 
                    onClick={() => State.get().set("ui", {status:"cards"})}>
            <FontAwesomeIcon icon={faCaretLeft} />
                            &nbsp;New Card
            </button>
            <button className="navigate-reverse col-lg-2 col-md-3" 
                    onClick={() => State.get().set("ui", {status:"export"})}>
            <FontAwesomeIcon icon={faDownload} />
                            &nbsp;Export Resource
            </button>
            </div>
            <div className="row box">
                {
                resources.map(
                        (resource, i) => {
                            if (i % 2 == 1) return; // Every other resource would be a plandef
                            const actTitleNode = SchemaUtils.getChildOfNode(resource, "title");
                            const planTitleNode = SchemaUtils.getChildOfNode(resources[i+1], "title");
                            const firstExpression: string | undefined = SchemaUtils.getChildOfNodePath(resources[i+1], ["action", "condition", "expression", "expression"])?.value;
                            const conditionExpressions: string[] = firstExpression ? [firstExpression] : [];
                            const profile = SchemaUtils.getChildOfNode(resource, "profile");
                        return <div className="col-lg-3 col-md-4 col-sm-6" key={i}>
                            <Folder 
                            actTitle={actTitleNode?.value ? actTitleNode.value : "Untitled AD"}
                            planTitle={planTitleNode?.value ? planTitleNode.value : "Untitled PD"}
                            conditionExpressions={conditionExpressions}
                            type={profile ? (profile as any).profile.split("-")[1] : "computable"}
                            wait={i*25} 
                            index={i}
                            />
                        </div>
                })
            } 
            </div>
        </div>
    );
}

export default Collection