import * as cql from 'cql-execution';
import { Library } from 'fhir/r4';
import Freezer from 'freezer-js';
import { SageNodeInitialized, SimplifiedProfiles, SimplifiedValuesets, SageSupportedFhirResource } from './helpers/schema-utils';

export interface StateVars {
	ui: {
		status: SageUiStatus,
		openMode?: string,
		replaceId?: number,
		count?: number,
		update?: {from: string, to: string}[],
		selectedNode?: SageNodeInitialized
	},
	mode: "basic" | "advanced",
	VSACEndpoint: string,
	UMLSKey: string,
	version: string,
	date: string,
	status: string,
	experimental: boolean,
	copyright: string,
	approvalDate: string,
	lastReviewDate: string,
	author: string,
	editor: string,
	reviewer: string,
	CPGName: string,
	publisher: string,
	canonicalUris: {uri: string, resourceType: string}[],
	showHiddenElements: boolean,
	bundle?: {
		pos: number
		resources: SageNodeInitialized[],
	},
	simplified: { // Data only used by the simplified view
		libraries: {
			[libraryIdentifier: string]: {
				fhirLibrary: Library,
				library: cql.Library,
				url: string,
			}
		}
	}
	resCount?: number,
	errFields?: string[],
	profiles: SimplifiedProfiles,
	valuesets: SimplifiedValuesets,
}

export type SageUiStatus = 'ready' | 'contained' | 'open' | 'validation_error' | 'resource_load_error' | 'ref_warning' | 'codePicker' 
	| 'change_profile' | 'missing_title_error' | 'id_duplicate_error' | 'title_duplicate_error' | 'url_duplicate_error' | 'cards' | 'collection'
	| 'loading' | 'profile_load_error' | 'export' | 'cpg' | 'valueSet' | 'settings' | 'select' | 'basic-cpg';

const defaultStateVars: StateVars = {
	ui: { 
		status: "loading",
	},
	mode: "advanced",
	VSACEndpoint: "https://cts.nlm.nih.gov/fhir/r4",
	UMLSKey: "",
	version: "",
	date: "",
	status: "",
	experimental: true,
	copyright: "",
	approvalDate: "",
	lastReviewDate: "",
	author: "",
	editor: "",
	reviewer: "",
	CPGName: "",
	publisher: "",
	canonicalUris: [], // URIs to reference in canonical elements
	simplified: {
		libraries: {}
	},
	showHiddenElements: false,
	profiles: {},
	valuesets: {},
}

const State = new Freezer(defaultStateVars);

export default State;
