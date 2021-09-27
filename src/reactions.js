/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import State from './state';
import * as SchemaUtils from './helpers/schema-utils';
import * as BundleUtils from './helpers/bundle-utils';

const canMoveNode = function(node, parent) {
	if (!["objectArray", "valueArray"].includes(parent?.nodeType)) {
		return [false, false];
	}
	const index = parent.children.indexOf(node);
	return [index>0, index<(parent.children.length-1)];
};

const findParent = function(targetNode) {
	var _walkNode = function(node) {
		if (!node.children) { return; }
		for (let i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			if (child === targetNode) {
				return [node, i];
			} else if (child.children) {
				var result;
				if (result = _walkNode(child)) {
					return result; 
				}
			}
		}
	};
	return _walkNode(State.get().resource);
};

const getSplicePosition = function(children, index) {
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (child.index > index) {
			return i;
		}
	}
	return children.length;
};

const getChildBySchemaPath = function(node, schemaPath) {
	for (let child of Array.from(node.children)) {
		if (child.schemaPath === schemaPath) { return child; }
	}
};

const getParentById = function(id) {
	var _walkNode = function(node) {
		if (!node.children) { return; }
		for (let i = 0; i < node.children.length; i++) {
			const child = node.children[i];
			if (child.id === id) {
				return [node, i];
			} else if (child.children) {
				var result;
				if (result = _walkNode(child)) {
					return result; 
				}
			}
		}
	};
	return _walkNode(State.get().resource);
};

State.on("load_initial_json", function(profilePath, resourcePath, isRemote) {
	const queue = [
		[profilePath, "set_profiles", "profile_load_error"],
		[resourcePath, "load_json_resource", "resource_load_error"]
	];

	State.emit("set_ui", "loading");
	let current = null;
	const loadNext = function() {
		if ((current = queue.shift()) && current[0]) {
			return $.ajax({ 
				url: current[0],
				dataType: "json",
				success: onLoadSuccess,
				error: onLoadError
			});		
		} else if (!isRemote) {
			return State.emit("set_ui", "ready");	
		}
	};
		
	var onLoadSuccess = function(json) {
		State.emit(current[1], json);
		return loadNext();
	};

	var onLoadError = (xhr, status) => State.emit("set_ui", current[2]);

	return loadNext();
});

State.on("set_profiles", json => State.get().set({
    profiles: json.profiles,
    valuesets: json.valuesets
}));

const checkBundle = json => (json.resourceType === "Bundle") && json.entry;

const decorateResource = function(json, profiles) {
	if (!SchemaUtils.isResource(profiles, json)) { return; }
	return SchemaUtils.decorateFhirData(profiles, json);
};

const openResource = function(json) {
	let decorated;
	const state = State.get();

	if (decorated = decorateResource(json, state.profiles)) {
		state.set({resource: decorated, bundle: null});
		return true;
	}
};

const openBundle = function(json) {
	let decorated;
	const state = State.get();
	const resources = BundleUtils.parseBundle(json);

	if (decorated = decorateResource(resources[0], state.profiles)) {
		state.pivot()
			.set("bundle", {resources, pos: 0})
			.set({resource: decorated});
		return true;
	}
};

const bundleInsert = function(json, isBundle) {
	let decorated;
	let resources;
	let state = State.get();

	//stop if errors
	const [resource, errCount] = 
		SchemaUtils.toFhir(state.resource, true);
	if (errCount !== 0) { 
		return state.ui.set("status", "validation_error");
	} else {
		state.bundle.resources.splice(state.bundle.pos, 1, resource).now();
		state = State.get();
	}

	resources = (() => {
		if (isBundle) {
		return resources = BundleUtils.parseBundle(json);
	} else if (json.id) {
		return [json];
	} else {
		const nextId = BundleUtils.findNextId(state.bundle.resources);
		json.id = BundleUtils.buildFredId(nextId);
		return [json];
	}
	})();

	if (decorated = decorateResource(resources[0], state.profiles)) {
		state.pivot()
			.set("resource", decorated)
			.bundle.resources.splice(state.bundle.pos+1, 0, ...resources)
			.bundle.set("pos", state.bundle.pos+1);
		return true;
	}
};

const replaceContained = function(json) {
	let decorated;
	const state = State.get();
	if (decorated = decorateResource(json, state.profiles)) {		
		const [parent, pos] = getParentById(state.ui.replaceId);
		parent.children.splice(pos, 1, decorated);
		return true;
	}
};

const isBundleAndRootId = (node, parent) => (node.fhirType === "id") && State.get().bundle &&
    (parent.level === 0);

State.on("load_json_resource", json => {
	const {
        openMode
    } = State.get().ui;
	const isBundle = checkBundle(json);

	const success = openMode === "insert" ?
		bundleInsert(json, isBundle)
	: openMode === "contained" ?
		replaceContained(json)
	: isBundle ?
		openBundle(json)
	:
		openResource(json);


	const {
		profiles,
		resource,
	} = State.get();
	const fhirType = resource.fhirType === "BackboneElement" ? resource.schemaPath : resource.fhirType; 
	const unusedElements = SchemaUtils.getElementChildren(profiles, fhirType, null);
	for (const element of unusedElements) {
		if (element.isRequired) {
			const curResource = State.get().resource;
			const {
				position,
				newNode
			} = getFhirElementNodeAndPosition(curResource, element);
			curResource.children.splice(position, 0, newNode);
		}
	}
	const status = success ? "ready" : "resource_load_error";
	return State.get().set("ui", {status});
});

State.on("set_bundle_pos", function(newPos) {
	let decorated;
	const state = State.get();
	
	//stop if errors
	const [resource, errCount] = 
		SchemaUtils.toFhir(state.resource, true);
	if (errCount !== 0) { 
		return state.ui.set("status", "validation_error");
	}

	if (!(decorated = decorateResource(state.bundle.resources[newPos], state.profiles))) {
		return State.emit("set_ui", "resource_load_error");
	}
	
	return state.pivot()
		//splice in any changes
		.set("resource", decorated)
		.bundle.resources.splice(state.bundle.pos, 1, resource)
		.bundle.set("pos", newPos)
		.ui.set({status: "ready"});
});


State.on("remove_from_bundle", function() {
	let decorated;
	const state = State.get();
	let {
        pos
    } = state.bundle;
	let newPos = pos+1;
	if (newPos === state.bundle.resources.length) {
		pos = (newPos = state.bundle.pos-1);
	}

	if (!(decorated = decorateResource(state.bundle.resources[newPos], state.profiles))) {
		return State.emit("set_ui", "resource_load_error");
	}
	
	return state.pivot()
		.set("resource", decorated)
		.bundle.resources.splice(state.bundle.pos, 1)
		.bundle.set("pos", pos);
});

State.on("clone_resource", function() {
	const state = State.get();

	//stop if errors
	const [resource, errCount] = 
		SchemaUtils.toFhir(state.resource, true);
	if (errCount !== 0) { 
		return state.ui.set("status", "validation_error");
	}

	resource.id = null;
	return bundleInsert(resource);
});

State.on("show_open_contained", node => State.get().ui.pivot()
    .set("status", "open")
    .set("openMode", "contained")
    .set("replaceId", node.id));

State.on("show_open_insert", () => State.get().ui.pivot()
    .set("status", "open")
    .set("openMode", "insert"));

State.on("set_ui", function(status, params) {
	if (params == null) { params = {}; }
	return State.get().ui.set({status, params});
});

State.on("value_update", (node, value) => node.ui.reset({status: "ready"}));

State.on("value_change", function(node, value, validationErr, strictValidationErr) {
	//in case there are pre-save errors
	State.get().ui.set({status: "ready"});

	if (node.ui) {
		return node.pivot()
			.set({value})
			.ui.set({validationErr})
			.now();
	} else {
		return node.pivot()
			.set({value})
			.set({ui: {}})
			.ui.set({validationErr})
			.now();
	}
});

State.on("start_edit", node => node.pivot()
    .set({ui: {}})
    .ui.set("status", "editing")
    .ui.set("prevState", node));

const getResourceType = function(node) {
	for (let child of Array.from(node.children)) {
		if (child.name === "resourceType") {
			return child.value;
		}
	}
};

const showReferenceWarning = function(node, parent, fredId) {
	const prevId = node.ui.prevState.value;
	const currentId = fredId || node.value;
	const resourceType = getResourceType(parent);
	const prevRef = `${resourceType}/${prevId}`;
	const newRef = `${resourceType}/${currentId}`;
	const changeCount = 
		BundleUtils.countRefs(State.get().bundle.resources, prevRef);
	if (changeCount > 0) {
		return State.get().ui.pivot()
			.set({status: "ref_warning"}) 
			.set({count: changeCount}) 
			.set({update: [{from: prevRef, to: newRef }]});
	}
};

State.on("update_refs", function(changes) {
	const resources = 
		BundleUtils.fixAllRefs(State.get().bundle.resources, changes);

	State.get().bundle.set("resources", resources);
	return State.emit("set_ui", "ready");
});

State.on("end_edit", function(node, parent) {
	if (isBundleAndRootId(node, parent) && 
		(node.value !== node.ui.prevState.value)) {
			showReferenceWarning(node, parent);
		}

	return node.ui.reset({status: "ready"});
});

State.on("cancel_edit", function(node) {
	if (node.ui.validationErr) {
		State.get().ui.set("status", "ready");
	}
	if (node.ui.prevState) {
		return node.reset(node.ui.prevState.toJS());
	}
});

State.on("delete_node", function(node, parent) {
	let index, targetNode;
	if ((parent.nodeType === "objectArray") &&
		(parent.children.length === 1)) {
			[targetNode, index] = findParent(parent);
	} else {
		targetNode = parent;
		index = parent.children.indexOf(node);
	}

	//don't allow deletion of root level id in bundled resource
	if (isBundleAndRootId(node, parent)) {
		const nextId = BundleUtils.findNextId(State.get().bundle.resources);
		const fredId = BundleUtils.buildFredId(nextId);
		node.pivot()
			.set({value: fredId})
			.ui.set({status: "ready"});

		return showReferenceWarning(node, parent, fredId);

	} else if (index !== null) {
		return targetNode.children.splice(index, 1);
	}
});

State.on("move_array_node", function(node, parent, down) {
	const position = parent.children.indexOf(node);
	const newPostion = down ? position+1 : position-1;

	node = node.toJS();
	node.ui.status = "ready";
	return parent.children
		.splice(position, 1)
		.splice(newPostion, 0, node);
});

State.on("show_object_menu", function(node, parent) {
	let unusedElements;
	if (node.nodeType !== "objectArray") {
		const {
            profiles
        } = State.get();
		const usedElements = [];
		for (let child of Array.from(node.children)) { 
			if (!child.range || (child.range[1] === "1") || (child.nodeType === "valueArray") || (
				(child.range[1] !== "*") && (parseInt(child.range[1]) < (child?.children?.length || 0))
			)) {
				usedElements.push(child.schemaPath);
			}
		}

		const fhirType = node.fhirType === "BackboneElement" ? node.schemaPath : node.fhirType; 
		unusedElements = SchemaUtils.getElementChildren(profiles, fhirType, usedElements);
	}
	const [canMoveUp, canMoveDown] = canMoveNode(node, parent);

	return node.pivot()
		.set({ui: {}})
		.ui.set({status: "menu"})
		.ui.set({menu: {}})
		.ui.menu.set({canMoveUp})
		.ui.menu.set({canMoveDown})
		.ui.menu.set({unusedElements});
});

State.on("show_code_picker", function(node) {
	State.get().ui.pivot().set("selectedNode", node);
	return State.emit("set_ui", "codePicker");
});

// Insert system, code, version, and display elements to the given node.
// `node` is expected to be of type Coding
State.on("insert_from_code_picker", function(node, system, code, systemOID, version, display) {

	if (node.fhirType != "Coding") {
		console.log("insert_from_code_picker event emitted with an unexpected FHIR type -- returning");
		return;
	}

	const pathToParam = {
		'Coding.system' : system,
		'Coding.code': code,
		'Coding.version': version,
		'Coding.display': display,
	};

	// Delete system, code, version, and display children, if they exist
	const childrenToRemove = [];
	for (const child of node.children) {
		if (Object.keys(pathToParam).includes(child.schemaPath)) {
			childrenToRemove.push(child);
		}
	}
	for (const child of childrenToRemove) {
		node = node.pivot().children.splice(node.children.indexOf(child), 1);
	}

	// Create system, code, version, and display nodes with the given values
	const codingElementChildren = SchemaUtils.getElementChildren(State.get().profiles, 'Coding', null);
	for (const child of codingElementChildren) {
		if (!Object.keys(pathToParam).includes(child.schemaPath)) {
			continue;
		}
		const {
			position,
			newNode
		} = getFhirElementNodeAndPosition(node, child)
		newNode.value = pathToParam[newNode.schemaPath];
		newNode.ui = {status: "ready"};
		node = node.pivot().children.splice(position, 0, newNode);
	}
});

State.on("add_array_value", function(node) {
	const {
        profiles
    } = State.get();
	const newNode = SchemaUtils.buildChildNode(profiles, "valueArray", node.schemaPath, node.fhirType);
	newNode.ui = {status: "editing"};
	return node.children.push(newNode);
});

State.on("add_array_object", function(node) {
	const {
        profiles
    } = State.get();
	const newNode = SchemaUtils.buildChildNode(profiles, "objectArray", node.schemaPath, node.fhirType);
	return node.children.push(newNode);
});	

const getFhirElementNodeAndPosition = function(node, fhirElement) {
	let child, newNode;
	const {
        profiles
    } = State.get();

	if (fhirElement.range && (fhirElement.range[1] !== "1") &&
		(child = getChildBySchemaPath(node, fhirElement.schemaPath))) {
			newNode = SchemaUtils.buildChildNode(profiles, "objectArray", child.schemaPath, child.fhirType);
			child.children.push(newNode);			
			return;
		}

	newNode = SchemaUtils.buildChildNode(profiles, node.nodeType, fhirElement.schemaPath, fhirElement.fhirType);
	if (["value", "valueArray"].includes(newNode.nodeType)) {
		newNode.ui = {status: "editing"};
	}

	// Elements with Fixed values should not be modified
	// TODO: disallow user edits
	if (newNode.isFixed) {
		newNode.ui.status = "ready";
	}

	const position = getSplicePosition(node.children, newNode.index);

	return {
		position,
		newNode,
	};
}

State.on("add_object_element", function(node, fhirElement) {
	const {
		position,
		newNode
	} = getFhirElementNodeAndPosition(node, fhirElement);

	return node.children.splice(position, 0, newNode);
});


export default State;
