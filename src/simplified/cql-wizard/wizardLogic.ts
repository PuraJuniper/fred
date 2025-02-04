import State from "../../state";
import { Moment } from "moment";
import { getConceptsOfValueSet, SageCodeConcept, SimplifiedProfiles } from "../../helpers/schema-utils";
import { Coding, PlanDefinitionActionCondition } from "fhir/r4";
import { EditableCondition } from "./conditionEditor";
import _ from "lodash";
import { CONDITION, PATIENT } from "../nameHelpers";

// Pages of the wizard
export enum WizardPage {
    SelectResource = 1,
    SelectCodes,
    SelectFilters,
}
export enum StepStatus {
    Disabled = 1, // Step is needed, but cannot be completed yet
    Incomplete,
    Complete,
    Skipped, // Step is not needed
}
export const WizardPagesArr: WizardPage[] = [WizardPage.SelectResource, WizardPage.SelectCodes, WizardPage.SelectFilters];

export interface SageCoding extends Coding {
    code: NonNullable<Coding['code']>
    display: NonNullable<Coding['display']>
    system: NonNullable<Coding['system']>
    version: NonNullable<Coding['version']>
    __sageDefinitions?: string[],
    __sageSynonyms?: string[],
}

// Wizard state and its reducer function
export interface WizardState {
    page: WizardPage,
    pageStatus: { [key in WizardPage]: StepStatus },
    resType: string,
    exists: boolean,
    atLeast: number | null,
    noMoreThan: number | null,
    codes: SageCoding[],
    filters: ElementFilter[],
    actionsDisabled: boolean,
}
export type WizardAction = ['changePage', WizardPage ] | ['selectExprType', string, ElementFilter[]] | ['setCodes', SageCoding[]] | ['setFilters', ElementFilter[]] 
            | ['setState', WizardState] | ['disableActions'] | ['enableActions'] | ['setExists', boolean] 
            | ['setAtLeast', {atLeast: number | null, noMoreThan: number | null}] | ['setNoMoreThan', {atLeast: number | null, noMoreThan: number | null}];
export function WizardReducer(prevWizState: WizardState, action: WizardAction): WizardState {
    // If some asynchronous action is being performed, use 'disableActions' and 'enableActions' to drop all events that occur before it is complete
    if (prevWizState.actionsDisabled && action[0] !== "enableActions") {
        return prevWizState;
    }
    switch(action[0]) {
        case 'setExists':
            {
            return {
                ...prevWizState,
                exists: action[1]
            }        
        }
        case 'setAtLeast':
            {
            const newPageStatus = {
                ...prevWizState.pageStatus,
                [WizardPage.SelectCodes]: action[1].atLeast === null || action[1].noMoreThan === null ? StepStatus.Complete 
                    : action[1].atLeast > action[1].noMoreThan ? StepStatus.Incomplete : StepStatus.Complete,
            }
            return {
                ...prevWizState,
                pageStatus: newPageStatus,
                atLeast: action[1].atLeast
            }
        }
        case 'setNoMoreThan':
            {
                const newPageStatus = {
                    ...prevWizState.pageStatus,
                    [WizardPage.SelectCodes]: action[1].atLeast === null || action[1].noMoreThan === null ? StepStatus.Complete 
                        : action[1].atLeast > action[1].noMoreThan ? StepStatus.Incomplete : StepStatus.Complete,
                }
            return {
                ...prevWizState,
                pageStatus: newPageStatus,
                noMoreThan: action[1].noMoreThan
            }
            }
        case 'disableActions':
            return {
                ...prevWizState,
                actionsDisabled: true,
            }
        case 'enableActions':
            return {
                ...prevWizState,
                actionsDisabled: false,
            }
        case 'setState':
            return {
                ...action[1]
            };
        case 'changePage':
            return {
                ...prevWizState,
                page: action[1]
            }
        case 'selectExprType':
            {
                let newPage = WizardPage.SelectCodes;
                const newPageStatus = {
                    ...prevWizState.pageStatus,
                    [WizardPage.SelectResource]: StepStatus.Complete,
                }
                let newCodes = prevWizState.codes;
                let newFilters = prevWizState.filters;

                // Reset selected codes and filters if the selected resource type has changed
                if (prevWizState.resType != action[1]) {
                    newCodes = [];
                    newFilters = action[2];
                    newPageStatus[WizardPage.SelectFilters] = newFilters.some(v=>v.filter.error) ? StepStatus.Incomplete : StepStatus.Complete;
                }

                // Set status of SelectCodes page
                newPageStatus[WizardPage.SelectCodes] = newCodes.length === 0 ? StepStatus.Incomplete : StepStatus.Complete;

                // Skip code selection if we're filtering for Patient
                if ([PATIENT].includes(action[1])) {
                    newPageStatus[WizardPage.SelectCodes] = StepStatus.Skipped;
                    newPage = WizardPage.SelectFilters;
                }
                else {
                    // Disable filters page if no code has been selected
                    if (newCodes.length === 0) {
                        newPageStatus[WizardPage.SelectFilters] = StepStatus.Disabled;
                    }
                }

                return {
                    ...prevWizState,
                    page: newPage,
                    pageStatus: newPageStatus,
                    resType: action[1],
                    codes: newCodes,
                    filters: newFilters,
                };
            }
        case 'setCodes':
            {
                const newPageStatus = {
                    ...prevWizState.pageStatus,
                    [WizardPage.SelectCodes]: action[1].length === 0 ? StepStatus.Incomplete : StepStatus.Complete,
                }

                // Disable filters page if no code has been selected, unless the resource cannot be filtered by code
                // if (action[1].length === 0 && !(['Gender', 'Age'].includes(prevWizState.resType))) {
                //     newPageStatus[WizardPage.SelectFilters] = StepStatus.Disabled;
                // }
                // else { // Enable filters page otherwise
                    newPageStatus[WizardPage.SelectFilters] = prevWizState.filters.some(v => v.filter.error) ? StepStatus.Incomplete : StepStatus.Complete;
                // }

                return {
                    ...prevWizState,
                    pageStatus: newPageStatus,
                    codes: action[1],
                };
            }
        case 'setFilters':
            {
                const newPageStatus = {
                    ...prevWizState.pageStatus,
                    [WizardPage.SelectFilters]: action[1].some(v => v.filter.error) ? StepStatus.Incomplete : StepStatus.Complete,
                }
                return {
                    ...prevWizState,
                    pageStatus: newPageStatus,
                    filters: action[1],
                }
            }
    }
}

// Return an initialized state with values copied from `fromState` if possible
export function initFromState(state: WizardState | null): WizardState {
    const startPage = WizardPage.SelectResource;
    if (state !== null) {
        return {
            ...state,
            page: startPage,
        };
    }
    else {
        return {
            page: startPage,
            pageStatus: {
                [WizardPage.SelectResource]: StepStatus.Incomplete,
                [WizardPage.SelectCodes]: StepStatus.Disabled,
                [WizardPage.SelectFilters]: StepStatus.Disabled,
            },
            resType: "",
            codes: [],
            filters: [],
            exists: true,
            atLeast: null,
            noMoreThan: null,
            actionsDisabled: false,
        }
    }
}

// Various types for filtering by FHIR element

export interface GenericFilterProperties {
    filterType: GenericFilterType
}

export type GenericFilterType = CodeFilterType | DateFilterType | PeriodDateFilterType | BooleanFilterType

export type BooleanFilterType = boolean | null
export interface GenericFilter {
    type: FilterTypeCode;
    toFriendlyString(): string,
    binding?: CodeBinding | {definition: string | undefined}
    filterProps : GenericFilterProperties, 
    error: boolean
}
export type GenericElementFilter = CodingFilter | DateFilter | BooleanFilter | PeriodFilter | MultitypeFilter | UnknownFilter
export interface ElementFilter<FilterType extends GenericElementFilter = GenericElementFilter> {
    elementName: string,
    filter: FilterType,
}

export enum FilterTypeCode {
    Coding = "coding",
    Date = "date",
    Age = "age",
    Boolean = "boolean",
    Period = "period",
    Integer = "integer",
    Range = "range",
    Multitype = "multitype",
    Unknown = "unknown",
}

export class CodingFilter implements GenericFilter {
    type = FilterTypeCode.Coding;
    binding: CodeBinding;

    constructor(binding: CodeBinding) {
        this.binding = binding;
    }

    filterProps: GenericFilterProperties & {selectedIndexes: number[]} = {
        filterType: CodeFilterType.None,
        selectedIndexes: [], // Indexes into CodeBinding.codes
    }
    error = false;
    toFriendlyString(): string {
            return `${
                (this.filterProps.selectedIndexes.length === 0 || this.filterProps.filterType === CodeFilterType.None) ? 'Any' :
                this.binding.codes[this.filterProps.selectedIndexes[0]].display
            }`;
        }
}

export enum CodeFilterType {
    None = "no_code",
    Filtered = "some_code(s)",
}
interface CodeBinding {
    codes: SageCodeConcept[],
    isCoding: boolean, // if false, these codes must be compared as strings in CQL
    isSingleton: boolean, // if false, we need to loop through codes of the element in CQL
    definition: string | undefined
}
export class DateFilter implements GenericFilter{
    binding: { definition: string | undefined; };
    error = false;
    toFriendlyString() {
        const dateOne = this.filterProps.absoluteDate1 !== null ? this.filterProps.absoluteDate1.format('MMMM Do YYYY') : '';
        const dateTwo = this.filterProps.absoluteDate2 !== null ? this.filterProps.absoluteDate2.format('MMMM Do YYYY') : '';
        if (this.filterProps.filterType === DateFilterType.None) {
            return DateFilterType.None;
        } else if (this.filterProps.filterType === DateFilterType.Before || this.filterProps.filterType === DateFilterType.After){
            const prefix = this.type === FilterTypeCode.Age ? 'Birthday: ' : 'Date: '
            const relativeWord = this.filterProps.filterType + ' '
            return prefix + relativeWord + dateOne;
        } else if (this.filterProps.filterType === DateFilterType.Between){
            const prefix = this.type === FilterTypeCode.Age ? 'Birthday: ' : 'Date: '
            const relativeWord = this.filterProps.filterType + ' '
            return prefix + `${relativeWord} ${dateOne} and ${dateTwo}`;
        } else {
            const prefix = this.type === FilterTypeCode.Age ? 'Age: ' : 'Date: '             
            const relativeWord = `${
                this.type === FilterTypeCode.Age ? this.filterProps.filterType + ' than '
                    : this.filterProps.filterType === DateFilterType.OlderThan ? 'Occured after '
                    : this.filterProps.filterType === DateFilterType.YoungerThan ? 'Occured before ' : ''
            }`
            const suffix = this.type === FilterTypeCode.Age ? "old" : "of time"       

            return prefix + relativeWord + this.filterProps.relativeAmount  + ` ${this.filterProps.relativeUnit} ` + suffix;
        }
    }
    type: FilterTypeCode;

    constructor(schemaDef: string | undefined, typecheck: string | FilterTypeCode)
     {
        this.type = (typecheck.endsWith(".birthDate") || typecheck.endsWith(FilterTypeCode.Age)) ? FilterTypeCode.Age : FilterTypeCode.Date;
        this.binding = {definition: schemaDef}
    }
    filterProps: GenericFilterProperties & {
        absoluteDate1: Moment | null,
        absoluteDate2: Moment | null,
        relativeAmount: number,
        relativeUnit?: RelativeDateUnit,
    } = {
        filterType: DateFilterType.None,
        absoluteDate1: null,
        absoluteDate2: null,
        relativeAmount: 0,
    }
}
export enum DateFilterType {
    None = "Any Date",
    Before = "Before",
    After = "After",
    Between = "Between",
    OlderThan = "Older",
    YoungerThan = "Younger",
}

export enum RelativeDateUnit {
    Minutes = "minutes",
    Hours = "hours",
    Days = "days",
    Weeks = "weeks",
    Months = "months",
    Years = "years",
}
export class PeriodFilter implements GenericFilter {
    type = FilterTypeCode.Period;
    error = false;
    toFriendlyString() {
        const dateOrTime = (this.filterProps.dateType === PeriodDateType.Absolute ? 'date' : 'time') + ':';
        const startPrefix = `Start-${dateOrTime} ${this.filterProps.startDateType}`;
        const endPrefix = `End-${dateOrTime} ${this.filterProps.endDateType}`
        const friendify = (prefix: string, date: RelativeDate | Moment | null) => 
        `${prefix}  ${date ? `${instanceOfRelativeDate(date) && date !== null ?
             `${date.amount === undefined ? '' : `${date.amount} ${date.unit}`}` : date !== null ? date.toLocaleString() : ''}` : ''}`;
        const friendlyStart = friendify(startPrefix, this.filterProps.startDate);
        const friendlyEnd = friendify(endPrefix, this.filterProps.endDate);
        const conjunction = (friendlyStart === '' || friendlyEnd === '') ? '' : 'and';
        return `${friendlyStart} ${conjunction} ${friendlyEnd}`;
    }

    constructor(definition?: string) {
        this.binding = {definition: definition}
    }
    filterProps: GenericFilterProperties & PeriodDateFilter<PeriodDateType> = {
        filterType: null,
        dateType: PeriodDateType.Relative,
        startDateType: PeriodDateFilterType.None,
        startDate: null,
        endDateType: PeriodDateFilterType.None,
        endDate: null,
    };

    binding: {
        definition: string | undefined
    }
}

export type PeriodDateFilter<DateType extends PeriodDateType> = DateType extends PeriodDateType.Absolute ? {
    dateType: DateType,
    startDateType: PeriodDateFilterType,
    startDate: Moment | null,
    endDateType: PeriodDateFilterType,
    endDate: Moment | null,
} : {
    dateType: DateType,
    startDateType: PeriodDateFilterType,
    startDate: RelativeDate | null,
    endDateType: PeriodDateFilterType,
    endDate: RelativeDate | null
}


export function instanceOfRelativeDate(object: Moment | RelativeDate | null): object is RelativeDate | null {
    return object ? 'unit' in object : true;
}
export interface RelativeDate {
    amount: number,
    unit: RelativeDateUnit,
}
export enum PeriodDateType { // Both dates must be the same type or else the CQL would not be valid
    Relative = "relative",
    Absolute = "absolute",
}
export enum PeriodDateFilterType {
    None = "Any",
    Before = "Before",
    After = "After",
}
export class BooleanFilter implements GenericFilter {
    constructor();
    constructor(boolVal: BooleanFilterType);
    constructor(boolVal?: BooleanFilterType) {
        this.filterProps = {filterType: boolVal ?? null};
    }
    filterProps: {filterType: BooleanFilterType};
    type = FilterTypeCode.Boolean;
    error = false; // All possibilities for this filter are accepted
    toFriendlyString(): string {
        return  this.filterProps.filterType !== null ?
                    this.filterProps.filterType ? 'Yes' : 'No'
                : 'Any';
    }
}
export class UnknownFilter implements GenericFilter {
    toFriendlyString(): string {return "Unknown Filter"}
    binding?: undefined;
    filterProps: GenericFilterProperties = { filterType: null };
    type = FilterTypeCode.Unknown;
    error = false;
}
export class MultitypeFilter implements GenericFilter {
    constructor(possibleFilters: ElementFilter[]) {
        this.possibleFilters = possibleFilters;
    }
    toFriendlyString(): string {
        return  this.selectedFilter === undefined ? 'None'
                    : `${this.possibleFilters[this.selectedFilter].elementName}: ${this.possibleFilters[this.selectedFilter].filter.toFriendlyString()}`; 
    }
    binding?: CodeBinding | { definition: string | undefined; } | undefined;
    filterProps: GenericFilterProperties = { filterType: null };
    type = FilterTypeCode.Multitype;
    selectedFilter?: number = undefined; // Index of selected filter in `possibleFilters`
    possibleFilters: ElementFilter[] = [];
    error = false;
}

// Returns a filter type for the given element path in the profile identified by `url`
// These filter types should include all information needed by the UI to know what controls should be displayed
//  to the user for the element.
async function getFilterTypeOfElement(url: string, elementFhirPath: string, typeIndex?: number): Promise<GenericElementFilter> {
    const unknownFilter: UnknownFilter = new UnknownFilter();
    const elementSchema = State.get().profiles[url][`${elementFhirPath}`];
    if (!elementSchema) {
        console.log(`No schema found for ${elementFhirPath} in ${url}`);
        return unknownFilter;
    }

    let selectedTypeIndex = typeIndex;
    // If no particular index was given, check if this element has multiple possible types
    if (selectedTypeIndex === undefined && elementSchema.type.length > 1) {
        return new MultitypeFilter(await Promise.all(elementSchema.type.map(async (type, i): Promise<ElementFilter> => {
            return {
                elementName: `${type.code[0].toUpperCase()}${type.code.slice(1)}`,
                filter: await getFilterTypeOfElement(url, elementFhirPath, i),
            }
        })))
    }

    // Default to the first type
    if (selectedTypeIndex === undefined) {
        selectedTypeIndex = 0;
    }

    if (["code", "CodeableConcept", "Coding"].includes(elementSchema.type[selectedTypeIndex]?.code)) {
        const valueSetReference = elementSchema.binding?.reference;
        if (valueSetReference === undefined) {
            console.log(`No code bindings exist for ${elementFhirPath}`);
            return unknownFilter;
        }
        const valueSet = State.get().valuesets[valueSetReference];
        if (!valueSet) {
            console.log(`ValueSet ${valueSetReference} could not be found`);
            return unknownFilter
        }
        const codes = await getConceptsOfValueSet(valueSet.rawElement, State.get().valuesets, State.get().codesystems);

        return new CodingFilter(
            {
                codes,
                isCoding: elementSchema.type[selectedTypeIndex]?.code !== "code",
                isSingleton: elementSchema.max === "1",
                definition: elementSchema.rawElement.definition,
            });
    }
    else if (["dateTime", "date"].includes(elementSchema.type[selectedTypeIndex]?.code)) {
        return new DateFilter(elementSchema.rawElement.definition, elementFhirPath)
    }
    else if (["Period"].includes(elementSchema.type[selectedTypeIndex]?.code)) {
        return new PeriodFilter(elementSchema.rawElement.definition);
    }
    else if (elementSchema.type[selectedTypeIndex]?.code === "boolean") {
        return new BooleanFilter();
    }
    else {
        console.debug("unknown", elementSchema);
        return unknownFilter;
    }
}

// Should be rewritten to use friendly-names
export async function createExpectedFiltersForResType(resType: string): Promise<ElementFilter[]> {
    let expectedElements: string[] = [];
    // let expectedBackboneElements: {[key: string]: string[]} = {}
    let schemaResType = resType;
    let url = "";
    switch(resType) {
        case "MedicationRequest": {
            expectedElements = ['status', 'statusReason', 'intent', 'category', 'doNotPerform', 'authoredOn']
            // const url = friendlyResourceRoot.RESOURCES.find(v => v.SELF.FHIR === ACTIVITY_DEFINITION)?.LIST?.find(lv => lv.FHIR === resType)?.DEFAULT_PROFILE_URI;
            url = "http://hl7.org/fhir/StructureDefinition/MedicationRequest"; // temporary
            break;
        }
        case "MedicationStatement": {
            expectedElements = ['status', 'statusReason', 'category', 'effective[x]']
            url = "http://hl7.org/fhir/StructureDefinition/MedicationStatement"; // temporary
            break;
        }
        case "AllergyIntolerance":
            expectedElements = ['clinicalStatus', 'verificationStatus', 'type', 'category', 'criticality', 'onset[x]', 'recordedDate',
             'reaction.severity', 'reaction.onset', 'reaction.substance', 'reaction.exposureRoute'];
            url = "http://hl7.org/fhir/StructureDefinition/AllergyIntolerance"; // temporary
            break;
        case CONDITION:
            expectedElements = ['clinicalStatus', 'verificationStatus', 'category', 'onset[x]', 'abatement[x]', 'recordedDate', 'stage.summary','stage.type']
            url = "http://hl7.org/fhir/StructureDefinition/Condition"
            break;
        case "Encounter":
            expectedElements = ['status', 'class', 'serviceType', 'priority', 'period',
            'hospitalization.admitSource','hospitalization.reAdmission','hospitalization.dietPreference','hospitalization.specialCourtesy',
            'hospitalization.specialArrangement','hospitalization.dischargeDisposition',
                'classHistory.class', 'classHistory.period',
                'statusHistory.status', 'statusHistory.period']
            url = "http://hl7.org/fhir/StructureDefinition/Encounter"
            break;
        case "Immunization":
            expectedElements = ['status', 'occurrence[x]', 'recorded']
            url = "http://hl7.org/fhir/StructureDefinition/Immunization"
            break;
        case "Observation":
            expectedElements = ['status', 'category', 'effective[x]', 'value[x]']
            url = "http://hl7.org/fhir/StructureDefinition/Observation"
            break;
        case "Procedure":
            expectedElements = ['status', 'statusReason', 'category', 'performed[x]']
            url = "http://hl7.org/fhir/StructureDefinition/Procedure"
            break;
        case "ServiceRequest":
            expectedElements = ['status', 'intent', 'category', 'priority', 'doNotPerform', 'occurrence[x]', 'authoredOn']
            url = "http://hl7.org/fhir/StructureDefinition/ServiceRequest"
            break;
        case PATIENT:
            expectedElements = ['birthDate','gender'];
            schemaResType = PATIENT;
            url = "http://hl7.org/fhir/StructureDefinition/Patient";
            break;
    }

    return Promise.all(expectedElements.map(async (expectedElement) => {
        return {
            elementName: expectedElement,
            filter: await getFilterTypeOfElement(url, `${schemaResType}.${expectedElement}`)
        }
    }));
}
export const memoizedCreateExpectedFiltersForResType = _.memoize(createExpectedFiltersForResType);

// Should be rewritten to use friendly-names
export function getSelectableResourceTypes() {
    return ['AllergyIntolerance', CONDITION, 'Device', 'Encounter', 'Immunization', 'MedicationStatement', 'MedicationRequest', 'Observation', 'Procedure', 'ServiceRequest', PATIENT]
}

export function getNextPage(curPage: WizardPage, stepStatus: WizardState["pageStatus"]): [true, WizardPage | null] | [false, WizardPage | null] {
    for (const i of WizardPagesArr) {
        if (i > curPage) {
            switch (stepStatus[i]) {
                case StepStatus.Incomplete:
                case StepStatus.Complete:
                    return [true, i];
                case StepStatus.Disabled:
                    return [false, i];
                case StepStatus.Skipped:
                    break;
            }
        }
    }

    // If at least one step is not completed/skipped, we can't save the expression
    const isWizIncomplete = Object.entries(stepStatus).some(e => e[1] != StepStatus.Complete && e[1] != StepStatus.Skipped);
    return isWizIncomplete ? [false, null] : [true, null];
}

export function getPrevPage(curPage: WizardPage, stepStatus: WizardState["pageStatus"]): [true, WizardPage] | [false, null] {
    if (curPage === WizardPage.SelectResource) {
        return [false, null];
    }
    // Since we're not on the first page, there must be a previous page
    const prevPage: [true, WizardPage] = [true, WizardPage.SelectResource];
    for (const i of WizardPagesArr) {
        if (i < curPage && (stepStatus[i] !== StepStatus.Skipped && stepStatus[i] != StepStatus.Disabled) && i > prevPage[1]) {
            prevPage[1] = i;
        }
    }
    return prevPage;
}

// Temporary storage/loading of wizard states for purpose of cql export feature
export const exprToWizStateMap: { [key: string]: EditableCondition } = {};
export function findEditableCondition(conditions: PlanDefinitionActionCondition[]): EditableCondition | null {
    for (const cond of conditions) {
        if (cond.id !== undefined && exprToWizStateMap[cond.id] !== undefined) {
            return exprToWizStateMap[cond.id];
        }
    }
    return null;
}
export function saveEditableCondition(conditionId: string, stateToSave: EditableCondition) {
    exprToWizStateMap[conditionId] = stateToSave;
}