import friendlyNames from "../../friendly-names.json";

export interface FriendlyResourceProps {
    FHIR: string;
    FRIENDLY: string;
    DEFAULT_PROFILE_URI?: string
    FORM_ELEMENTS?: FriendlyResourceFormElement[]
}

export type FriendlyResourceFormElement = {
    SELF: FriendlyResourceProps
    LIST?: FriendlyResourceFormElement[]
}

export interface FriendlyResourceType {
    SELF: FriendlyResourceProps,
    LIST?: FriendlyResourceProps[]
}

export type FriendlyResourceSelf = FriendlyResourceType["SELF"]
interface FriendlyResourceRoot {
    RESOURCES: FriendlyResourceType[]
}

export const friendlyResourceRoot: FriendlyResourceRoot = friendlyNames;

const defaultUndefinedString = "undefined";

const getType = (type: string) => {
    const result = friendlyNames.RESOURCES.find(
        (resourceTypes) => resourceTypes.SELF.FHIR === type);
    if (typeof (result) === 'undefined') {
        return "Undefined";
    } else {
        return result.SELF.FHIR;
    }
}

export const PLAN_DEFINITION = getType("PlanDefinition");
export const ACTIVITY_DEFINITION = getType("ActivityDefinition");
export const LIBRARY = getType("Library");
export const QUESTIONNAIRE = getType("Questionnaire");
export const DATA_ELEMENT = getType("DataElement");
export const VALUE_SET = getType("ValueSet");
export const STRUCTURE_DEFINITION = getType("StructureDefinition");

export function getFhirSelf(resourceParent: FriendlyResourceType[], resourceType: string) {
    return resourceParent.find(
        (resource) => {
            return resource.SELF.FHIR === resourceType;
        }
    );
}

function elseIfUndefined<T>(maybeUndefinedObject: T, ifDefinedFunction: (input: Exclude<T, undefined>) => string): string | undefined
function elseIfUndefined<T>(maybeUndefinedObject: T, ifDefinedFunction: (input: Exclude<T, undefined>) => string, replacementText: string): string
function elseIfUndefined<T>(maybeUndefinedObject: T, ifDefinedFunction: (input: Exclude<T, undefined>) => string, replacementText?: string): string | undefined {
    if (typeof (maybeUndefinedObject) === 'undefined') {
        return replacementText ?? undefined;
    } else {
        return ifDefinedFunction(maybeUndefinedObject as Exclude<T, undefined>); // This cast is necessary for some reason. todo: figure out how to remove it
    }
}

export const fhirToFriendly = (fhirWord: string) => {
    return elseIfUndefined(getFhirSelf(friendlyResourceRoot.RESOURCES, fhirWord)
        , ((o) => (o.SELF.FRIENDLY))
        , defaultUndefinedString);
}

export const friendlyToFhir = (friendlyWord: string) => {

    function findPossibleType() {
        const isMainType = friendlyResourceRoot.RESOURCES.find(resource => resource.SELF.FRIENDLY == friendlyWord);
        if (isMainType) {
            return isMainType.SELF;
        }

        const isSubType = (friendlyResourceRoot.RESOURCES.map(mainRes => {
            return mainRes.LIST?.find(subRes => subRes.FRIENDLY == friendlyWord);
        })).filter(unfound => unfound).at(0);
        if (isSubType) {
            return isSubType;
        }
        const isFormElem = (friendlyResourceRoot.RESOURCES.map(mainRes =>
            mainRes.LIST?.map(subRes =>
                subRes.FORM_ELEMENTS?.find(formElem => formElem.SELF.FRIENDLY == friendlyWord))
        )).filter(unfound => unfound).at(0)?.filter(unfound => unfound).at(0)?.SELF;

        return isFormElem;

    }

    return elseIfUndefined(findPossibleType()
        , ((object) => object.FHIR)
        , defaultUndefinedString);
}

export function profileToFriendlyResourceListEntry(profile?: string): FriendlyResourceProps {
    return friendlyResourceRoot.RESOURCES
        .map(resType => resType.LIST).flatMap(list => list ? [list] : [])
        .find(resTypeList => resTypeList.flatMap(item => item.DEFAULT_PROFILE_URI ? [item.DEFAULT_PROFILE_URI] : [])
            .find(uri => uri == profile))?.at(0) ??
    {
        FHIR: "",
        FRIENDLY: ""
    };
}

export function profileToFriendlyResourceSelf(profile?: string) {
    if (!profile) {
        return undefined;
    }
    for (const resource of friendlyResourceRoot.RESOURCES) {
        const found = resource.LIST?.find(res => res.DEFAULT_PROFILE_URI == profile);
        if (found) {
            return resource.SELF;
        }
    }
}

export const defaultProfileUriOfResourceType = (resourceType: string) => {
    return elseIfUndefined(getFhirSelf(friendlyResourceRoot.RESOURCES, resourceType)
        , ((object) => object.SELF.DEFAULT_PROFILE_URI ? object.SELF.DEFAULT_PROFILE_URI : "none"));
}

export function getBorderPropsForType(resourceType: string): string | undefined {
    switch (resourceType) {
        case ACTIVITY_DEFINITION:
            return "activitydefinition";
        default:
            return "questionnaire";
    }
}

export function getFormElementListForResource(resource: string): FriendlyResourceFormElement[] {
    const foundResource: FriendlyResourceProps | undefined = friendlyResourceRoot.RESOURCES
        .map(resType => resType.LIST).flatMap(list => list ? [list] : [])
        .map(resTypeList => resTypeList.find(resType => resType.FHIR == resource))
        .filter(def => def)
        .at(0);

    return foundResource?.FORM_ELEMENTS ?? []
}
