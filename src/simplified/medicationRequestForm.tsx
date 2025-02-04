import { faHomeLgAlt, faInfoCircle } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { Card, Col, Container, Form, Row } from "react-bootstrap";
import State from "../state";
import { FieldHandlerProps, ICardForm } from "./cardEditor";
import { CodeableConceptEditorProps } from "./codeableConceptEditor";
import * as Bioportal from './cql-wizard/bioportal';
import { SageCoding } from "./cql-wizard/wizardLogic";
import { FriendlyResourceProps, friendlyTimeUnit } from "./nameHelpers";
import { dropdownBoxProps, invisibleFieldProps, textBoxProps, timeUnitsDropdownProps } from "./outerCardForm";

// const dosageCodes: SageCoding[] = [];

export class MedicationRequestForm implements ICardForm {

    resourceType;

    constructor(resourceType: FriendlyResourceProps) {
        this.resourceType = resourceType;
    }

    textBoxFields = new Map<string, textBoxProps>([
        ['title', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: "",
            preview: {
                className: "display-page-title",
                displayFieldTitle: false,
            }
        }],
        ['description', {
            boxSize: 3,
            isReadOnly: false,
            isLink: false,
            caption: "",
            preview: {
                className: "",
                displayFieldTitle: false,
            }
        }],
        ['resource', {
            boxSize: 1, 
            isReadOnly: false,
            isLink: false,
            caption: "Related Artifact must be a valid URL.",
            preview: {
                className: "",
                displayFieldTitle: true,
            }
        }],
        ['text', {
            boxSize: 2,
            isReadOnly: true,
            isLink: false,
            caption: "",
            otherFieldTriggerFn: updateDosageAutofill,
            preview: {
                className: "",
                displayFieldTitle: true,
            }
        }],
        ['frequency', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: "",
            className: "page1-dosage-small",
            hideFieldTitle: true,
            requiredFor: ["text"],
            preview: {
                className: "display-page-dosage-small",
                displayFieldTitle: true,
            }
        }],
        ['period', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: "",
            className: "page1-dosage-small",
            hideFieldTitle: true,
            requiredFor: ["text"],
            preview: {
                className: "display-page-dosage-small",
                displayFieldTitle: true,
            }
        }],
        ['value', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: "",
            preview: {
                className: "display-page-dosage-medium",
                displayFieldTitle: true,
            }
        }],
        ['duration', {
            boxSize: 1,
            isReadOnly: false,
            isLink: false,
            caption: "",
            className: "page1-dosage-small",
            hideFieldTitle: true,
            requiredFor: ["text"]
        }]
    ]);

    dropdownFields = new Map<string, dropdownBoxProps>([
        ['status',
            { values: () => ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown'] }],
        ['intent',
            { values: () => ['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order', 'option']}],
        ['periodUnit', timeUnitsDropdownProps(['h', 'd', 'wk', 'mo', 'a'])],
        ['durationUnit', timeUnitsDropdownProps(['h', 'd', 'wk', 'mo', 'a'])],
        ['type',
            { values: () => ['documentation', 'justification', 'citation', 'predecessor', 'successor', 'derived-from', 'depends-on', 'composed-of'] }],
        ['unit',
            {
                values: GetDosageUnits, requiredFor: ["system", "code"],
                preview: {
                    className: "display-page-dosage-small",
                    displayFieldTitle: true,
                }
            }]
    ]);

    // displayBoxFields = new Map<string, previewProps>([]);

    codeableConceptFields: Map<string, Partial<CodeableConceptEditorProps>> = new Map<string, Partial<CodeableConceptEditorProps>>([
        ['productCodeableConcept', {preview: {
            className: "display-page-productRefernce",
            displayFieldTitle: true,
        }}]
    ]);

    resourceFields = ['dosage', 'timing', 'repeat', 'relatedArtifact', 'doseAndRate', 'doseQuantity'];

    invisibleFields : Map<string, invisibleFieldProps>  =  new Map<string, invisibleFieldProps>([
        ['system', { 
            otherFieldTriggerFn: updateUnitNode 
        }],
        ['code', { 
            otherFieldTriggerFn: updateUnitNode 
        }]
    ]);

    cardFieldLayout =
        {
            cardColumns: [
                ['placeholder', 'placeholder'],
                ['title', 'productCodeableConcept'],
                ['description', 'value'],
                ['status', 'unit'],
                ['intent','timing' ],
                ['resource','duration' ],
                ['type', 'text'],
                ['placeholder', 'placeholder'],
            ]

    };
                  
    cardDisplayLayout =
    {
        cardColumns: [
            ['title'],
            ['description'],
            ['value','unit','frequency','period','periodUnit'],
            ['resource'],
            ['text'],
        ]

    };




    pageOne: ICardForm['pageOne'] = (props) => {
        const placeHolderElem = (function(i: number) {
           return  <Form.Group className="page1-formgroup" key={"placeholder-formGroup-pageOne" + "-" + i} as={Col}>
            </Form.Group>
        });
        console.log(props)
        const timingElem =
        <Col className="page1-formgroup form-group"  key='timing-formGroup'>
            <Row className="justify-content-end">
                <Col xs="12">
                    <div className="page1-tooltip float-end fs-5">
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <Card className="page1-tooltiptext">
                            <div>E.g. 2 doses per day for a week would be expressed as:</div>
                            <div style={{'margin': "10px 0px",'display':'flex', 'flexDirection': 'row', 'whiteSpace':'nowrap', 'justifyContent':'flex-end','flex': '0 0 90%'}} >
                                <div className="page1-dosage-small-example">2</div>
                                <div style={{'margin': "0 10px"}}>dose(s) every</div>
                                <div className="page1-dosage-small-example">1</div>
                                <select className="page1-dosage-medium-example" disabled>
                                    <option value="">days</option>
                                </select>
                            </div>
                            <div style={{'display':'flex', 'flexDirection': 'row', 'whiteSpace':'nowrap', 'justifyContent':'flex-end', 'flex': '0 0 90%'}} >
                                <div style={{'margin': "0 10px"}}>for</div>
                                <div className="page1-dosage-small-example">1</div>
                                <select className="page1-dosage-medium-example" disabled>
                                    <option value="">weeks</option>
                                </select>
                            </div>
                        </Card>
                    </div>
                </Col>
                <Col xs="2">
                    {props.fieldElements[0]}
                </Col>
                <Col xs="4">
                    <div className="text-end">dose(s) every</div> 
                </Col>
                <Col xs="2">
                    {props.fieldElements[1]}
                </Col>
                <Col xs="4">
                    {props.fieldElements.find(x => x.key == 'periodUnit-fromGroup')}
                </Col>
            </Row>
        </Col>
        const durationElem =
        <Col className="page1-formgroup formGroup" key='duration-formGroup'>
            <Row className="flex-nowrap justify-content-end">
                <Col xs={{ span: 4, offset: 2 }}>
                    <div className="text-end">for</div>
                </Col>
                <Col xs="2">
                    {props.fieldElements[2]}
                </Col>
                <Col xs="4">
                    {props.fieldElements.find(x => x.key == 'durationUnit-fromGroup')}
                </Col>
            </Row>
        </Col>

        return (
            <Container>{
                ...this.cardFieldLayout.cardColumns.map((cr, i: number) => {
                    return (
                        <Row className="justify-content-center" key={"row-" + i} >
                            {cr.map((field, j: number) => {
                             return   [
                                    durationElem,
                                    timingElem,
                                    placeHolderElem(j),
                                    ...props.fieldElements
                                ].find(elem => elem.key?.toString().startsWith(field + "-"))
                            }
                                    )
                            }
                        </Row>
                    )
                })
            }</Container>
        );
    }

    pageTwo: ICardForm['pageTwo'] = (props) => {
        return props.conditionEditor;
    }

    pageThree: ICardForm['pageThree'] = (props) => {
        const placeHolderElem =
            <Form.Group key='placeholder-formGroup-pageThree' as={Col} >
            </Form.Group>;
        return (
            <div> {
                ...this.cardDisplayLayout.cardColumns.map((cr, i: number) => {
                    return (
                        <Row key={"row-" + i} className="mb-3">
                            {cr.map((field, i) => {
                                const foundElem = props.displayElements.find(elem =>
                                    elem.key?.toString().startsWith(field + "-"));

                                return foundElem !== undefined ?
                                    foundElem :
                                    React.cloneElement(placeHolderElem, { key: `${field}-${i}` })
                            })}
                        </Row>
                    )
                })
            }
            {props.conditions}
            </div>
        );
    }
}

function updateDosageAutofill(changedField: string, fieldValue: string, fieldHandlers: Map<string, FieldHandlerProps>): string {
    const fieldTriggers = ['frequency', 'period', 'periodUnit', 'duration', 'durationUnit'];
    const fieldVals = new Map(
        fieldTriggers.map(ft => { return [ft, ft == changedField ? fieldValue : fieldHandlers.get(ft)?.fieldContents] }));
    function pluralUnit(unit: number | string) {
        return unit > 1 ? 's' : '';
    }
    const timeString = (timeType: string, timeUnit: string) => {
        const noVal = (checkVal: string, noVal: string, yesVal: string) => checkVal == '' ? noVal : yesVal;
        const timeVal: string | number = noVal(fieldVals.get(timeType), '[NUM]', fieldVals.get(timeType));
        const friendlyTime = friendlyTimeUnit(fieldVals.get(timeUnit) ?? timeUnit);
        return timeVal + ' ' + friendlyTime + noVal(friendlyTime, '[TIME_UNIT]', pluralUnit(timeVal));
    }
    const test = <FontAwesomeIcon key="butSaveIcon" icon={faHomeLgAlt} style={{'color':'white','height':'30px','marginRight':'3rem'}} />
    return `Give ${timeString('frequency', 'dose')} every ${timeString('period', 'periodUnit')} for ${timeString('duration', 'durationUnit')}.`;
}

function updateUnitNode(changedField: string, fieldValue: string, fieldHandlers: Map<string, FieldHandlerProps>, requiredField?: string): string {
    // GetDosageSageCodings();
    const dosageSageCode = State.get().bioportal.doseUOMs.find(dc => dc.display == fieldValue);
    switch (requiredField) {
        case 'system':
            return dosageSageCode ? dosageSageCode.system == "" ? "http://unitsofmeasure.org" : dosageSageCode.system : "NOT_FOUND";
        case 'code':
            return dosageSageCode ? dosageSageCode.code : "NOT_FOUND";
        default:
            return 'NO_VALUE'
    }
}

function GetDosageUnits() : string[] {
    if (!State.get().bioportal.doseUnitsIsRetrieved) {
        State.emit("pull_bioportal_results")
    }
    return State.get().bioportal.doseUOMs.map(sc => sc.display).sort();
}

export async function getDosageSageCodings(): Promise<void> {
    const shortList: { name: string, notation: string }[] =
        [{ name: 'tablet', notation: '732936001' },
        { name: 'capsule', notation: '732937005' },
        { name: 'patch', notation: '739003001' },
        { name: 'mcg', notation: '258685003' },
        { name: 'gram', notation: '258682000' },
        { name: 'ml', notation: '258773002' },
        { name: 'mg', notation: '258684004' }
        ]
    if (!State.get().bioportal.doseUnitsIsRetrieved && State.get().bioportal.doseUOMs.length == 0) {
        State.get().bioportal.set({ doseUnitsIsRetrieved: true });
        await Bioportal.search(shortList.map(item => item.notation).reduce((acc, code) => code + ' ' + acc), ['HL7', 'SNOMEDCT'], 'text', undefined)
            .then(v => {
                State.get().bioportal.set({ doseUOMs: [...State.get().bioportal.doseUOMs, ...v].filter(res => res !== undefined) });
            })
    }
}
