/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { v4 as uuidv4 } from 'uuid';



export var fixAllRefs = function(resources, subs) {
	const fixed = [];
	for (let i = 0; i < resources.length; i++) {
		let resource = resources[i];
		if (resource.toJS) { resource = resource.toJS(); }
		this.fixRefs(resource, subs);
		fixed.push(resource);
	}
	return fixed;
};


export var fixRefs = function(resource, subs) {
	let count = 0;
	const _notDate = value => !(value instanceof Date);

	var _walkNode = function(node) {
		if (node instanceof Array) {
			return (() => {
				const result = [];
				for (let v of Array.from(node)) { 					result.push(_walkNode(v));
				}
				return result;
			})();

		} else if ((typeof node === "object") && _notDate(node)) {
			return (() => {
				const result1 = [];
				for (var k in node) {
					var v = node[k];
					if (k !== "reference") {
						result1.push(_walkNode(v));
					} else if (v) {
						result1.push((() => {
							const result2 = [];
							for (let sub of Array.from(subs)) {
								if (v && sub.from && 
							(v.toUpperCase() === sub.from.toUpperCase())) {
									if (sub.to) { node[k] = sub.to; }
									result2.push(count += 1);
								}
							}
							return result2;
						})());
					} else {
						result1.push(undefined);
					}
				}
				return result1;
			})();
		}
	};

	_walkNode(resource);
	return count;
};


export var countRefs = function(resources, ref) {
	let count = 0;
	for (let resource of Array.from(resources)) {
		const hasRefs = this.fixRefs(resource, [{from: ref}]);
		if (hasRefs !== 0) { count += 1; }
	}
	return count;
};


export var buildFredId = nextId => `FRED-${nextId}`;


export var findNextId = function(entries) {
	let maxId = 1;
	for (let entry of Array.from(entries)) {
		var id;
		if (id = entry.resource?.id || entry.id) {
			var matches;
			if (matches = id.match(/^fred\-(\d+)/i)) {
				maxId = Math.max(maxId, parseInt(matches[1])+1);
			}
		}
	}
	return maxId;
};


export var parseBundle = function(bundle, clearInternalIds) {
	let entry;
	const idSubs = [];
	let entryPos = this.findNextId(bundle.entry);
	for (entry of Array.from(bundle.entry)) {
		if ((entry.fullUrl && /^urn:uuid:/.test(entry.fullUrl)) ||
			!entry.resource.id || clearInternalIds) {
				var toId;
				const {
                    resourceType
                } = entry.resource;
				const fromId = entry.resource.id || entry.fullUrl;
				entry.resource.id = (toId = this.buildFredId(entryPos));
				idSubs.push({from: fromId, to: `${resourceType}/${toId}`});
				entryPos++;
			}
	}


	const resources = [];
	for (entry of Array.from(bundle.entry)) {
		this.fixRefs(entry.resource, idSubs);
		resources.push(entry.resource);
	}
	return resources;
};


export var generateBundle = function(resources, splicePos=null, spliceData) {
	let bundle, entry, resource;
	if (resources == null) { resources = []; }
	if (splicePos !== null) {
		resources = resources.splice(splicePos, 1, spliceData);
	}

	const idSubs = [];
	const entries = [];
	for (resource of Array.from(resources)) {
		var fullUrl, request;
		if (resource.toJS) { resource = resource.toJS(); }

		if (resource.id && !/^[Ff][Rr][Ee][Dd]\-\d+/.test(resource.id)) {
			fullUrl = `${resource.resourceType}/${resource.id}`;
			request = {method: "PUT", url: fullUrl};
		} else {
			fullUrl = `urn:uuid:${uuidv4()}`;
			request = {method: "POST", url: resource.resourceType};

			if (resource.id) {
				const fromId = `${resource.resourceType}/${resource.id}`;
				const toId = fullUrl;
				idSubs.push({from: fromId, to: toId});
				delete resource.id;
			}
		}

		entries.push({
			fullUrl,
			request,
			resource
		});
	}
	
	for (entry of Array.from(entries)) {
		this.fixRefs(entry.resource, idSubs);
	} 
	
	return bundle = { 
		resourceType: "Bundle",
		type: "transaction",
		meta: {
			lastUpdated: (new Date()).toISOString(),
			fhir_comments: ["Generated by FRED"]
		},
		entry: entries
	};
};




















