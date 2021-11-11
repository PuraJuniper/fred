# Reads profile files from ../fhir_profiles/{title} and strips out basic type definitions 
# and items not currently used by the editor to reduce file size.

fs = require "fs"
path = require "path"

inputPath = "../fhir_profiles"
outputPath = "../public/profiles"

summarizeDirectory = (inputDirName, inputDirPath, outputDirPath) ->
	console.log "Processing #{inputDirName}"
	profiles = {}
	valuesets = {}
	
	for bundleFileName in fs.readdirSync(inputDirPath).sort()
		continue unless bundleFileName.indexOf("json") > -1
		bundleFilePath = path.join(inputDirPath, bundleFileName)
		bundle = JSON.parse fs.readFileSync(bundleFilePath)

		if bundleFileName.indexOf("valuesets") > -1 
			summarizeValuesets(bundle, valuesets)
		else if bundleFileName.indexOf("profiles") > -1
			summarizeProfiles(bundle, profiles)

	fs.writeFileSync path.join(outputDirPath, "#{inputDirName}.json"),
		JSON.stringify {profiles: profiles, valuesets: valuesets}, null, "  "

summarizeValuesets = (fhirBundle, valuesets) ->
	dstu2 = (entry) ->
		url = entry?.resource?.url
		if (valuesets[url]?.items)
			return;
		#are they all complete?
		valuesets[url] = {type: "complete", items: []}
		for c, i in entry?.resource?.codeSystem?.concept || []
			valuesets[url].items.push [c.display, c.code]


	stu3 = (entry) -> 
		url = entry.resource.valueSet|| entry.resource.url
		if (valuesets[url]?.items)
			return;

		valuesets[url] = {type: entry.resource.content, items: []}

		_addValue = (concept) ->
			for c in concept || []
				if c.concept
					_addValue(c.concept)
				else
					valuesets[url].items.push [c.display, c.code]
				
		_addValue(entry?.resource?.concept)
	
	r4 = (entry) ->
		url = entry.resource.valueSet|| entry.resource.url
		if (valuesets[url]?.items)
			return;
		valuesets[url] = {type: entry.resource.content, items: [], system: entry.resource?.compose?.include?[0].system, version: entry?.resource?.compose?.include?[0].version}

		_addValue = (concept) ->
			for c in concept || []
				if c.concept
					_addValue(c.concept)
				else
					valuesets[url].items.push [c.display, c.code]
		
		_addValue(entry?.resource?.compose?.include?[0].concept)
		

	for entry in fhirBundle?.entry || []
		if entry?.resource?.valueSet and entry?.resource?.concept?.length > 0
			stu3(entry)
		else if entry?.resource?.url and entry?.resource?.codeSystem?.concept?.length > 0
			dstu2(entry)
		else if entry.resource.url
			r4(entry)

	return valuesets

summarizeProfiles = (fhirBundle, profiles) ->
	for entry in fhirBundle?.entry || []
		root = entry?.resource?.url
		continue if !root
		# continue unless root and 
		# 	root[0] is root[0].toUpperCase()

		ids = {}
		names = {}

		profiles[root] = {}
		profiles[root]["__meta"] = # sorry
			id: entry.resource.id
			url: entry.resource.url
			name: entry.resource.name
			title: entry.resource.title
			type: entry.resource.type
			baseDefinition: entry.resource.baseDefinition
			
		for e, i in entry?.resource?.snapshot?.element || []
			profiles[root][e.id] =
				index: i
				path: e.path
				sliceName: e.sliceName || ""
				min: e.min
				max: e.max
				type: e.type ||  [{"code": "DomainResource"}]
				isSummary: e.isSummary
				isModifier: e.isModifier
				short: e.short
				name: e.name
				rawElement: e

			if e.id && (e.id.endsWith("PlanDefinition.title") || e.id.endsWith("ActivityDefinition.title"))
				profiles[root][e.id]["min"] = 1

			if url = e?.binding?.valueSetReference?.reference
				profiles[root][e.id].binding =
					strength: e.binding.strength
					reference: url

			if url = e?.binding?.valueSet
				if url.lastIndexOf('|') != -1
					url = url.substring(0, url.lastIndexOf('|'))
				profiles[root][e.id].binding =
					strength: e.binding.strength
					reference: url

			#assumes id appears before reference - is this accurate?
			if e.id then ids[e.id] = e.id
			if e.name then names[e.name] = e.id

			#STU3
			if e.contentReference
				id = e.contentReference.split("#")[1]
				profiles[root][e.id].refSchema = ids[id]
			#DSTU2
			else if e.nameReference
				profiles[root][e.id].refSchema = names[e.nameReference]

	return profiles

for inputDirName in fs.readdirSync path.join(__dirname, inputPath)
	inputDirPath = path.join(__dirname, inputPath, inputDirName)
	outputDirPath = path.join(__dirname, outputPath)
	if fs.lstatSync(inputDirPath).isDirectory()
		summarizeDirectory(inputDirName, inputDirPath, outputDirPath)









