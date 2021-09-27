import Freezer from 'freezer-js';

const State = new Freezer({
	ui: { 
		status: "ready"
	},
	VSACEndpoint: "https://cts.nlm.nih.gov/fhir/r4",
	UMLSKey: "",
	resource: null,
	profiles: null
});

export default State;