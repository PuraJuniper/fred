import {BaseCard} from"./baseCard";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCaretRight, faInfoCircle} from  '@fortawesome/pro-solid-svg-icons';
import State from "../state";
import friendlyNames from "../../friendly-names.json";
import { makeLink, makeProfile } from "../helpers/schema-utils";

const SelectView = () => {    
    return (
        <div style={{marginTop:"50px", paddingRight:"12px"}}>
        <div className="row">
        <h3 className="col-lg-10 col-md-9" style={{color:"#2a6b92"}}><b>Make a Card</b></h3>
        <button className="navigate col-lg-2 col-md-3" 
        onClick={() => State.get().set("ui", {status:"collection"})}>
        Saved Resources&nbsp;<FontAwesomeIcon icon={faCaretRight} />
        
        </button>
        </div>
        <div className="row box">
        {
            friendlyNames.RESOURCES.map(
                (resourceType) => (
                    resourceType.LIST.map((resource, i) => (

                        <div className="col-lg-3 col-md-4 col-sm-6" key={i}>
                        <BaseCard
                        header={resourceType.SELF.FRIENDLY}
                        title={resource.FRIENDLY}
                        content={<div style={{ fontSize: "20px", textAlign: "right" }}>
                        <a href={makeLink(resource, resourceType.SELF)} target="_blank" rel="noreferrer" className="c-tooltip">
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <span className="c-tooltiptext">FHIR Docs</span>
                        </a>
                        </div>}
                        wait={i * 25}
                        clickable={true}
                        profile={makeProfile(resource)} />
                        </div>
                        )
                        )
                        )
                        )
                    }
                    </div>
                    </div>
                    );
                }
                
                export default SelectView