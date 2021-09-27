/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import ReactDOM from "react-dom";
import State from "./reactions";
import * as SchemaUtils from "./helpers/schema-utils";

import NavbarFred from "./navbar";
import RemoteNavbar from "./remote-navbar";
import BundleBar from "./bundle-bar";
import RefWarning from "./ref-warning";
import Footer from "./footer";

import DomainResource from "./domain-resource/";
import CpgDialog from "./dialogs/cpg-dialog";
import OpenDialog from "./dialogs/open-dialog";
import ExportDialog from "./dialogs/export-dialog";
import CodePickerDialog from "./dialogs/code-picker-dialog";
import UserSettingsDialog from "./dialogs/user-settings-dialog";

import AppInfo from "../package.json";

class RootComponent extends React.Component {
	
	constructor() {
		super();
		const versionSegments = AppInfo.version.split(".");
		//only take the major and minor
		this.appVersion = versionSegments.slice(0,versionSegments.length-1).join(".");
	}

	getQs() {
		const data = {};
		const params = window.document.location.search?.substr(1).split("&");
		for (let param of Array.from(params)) {
			const [k,v] = param.split("=");
			data[k] = decodeURIComponent(v);
		}
		return data;
	}

	componentDidMount() {
		const qs = this.getQs();

		if (qs.remote === "1") {
			this.isRemote = true;
		}

		if (qs.warn !== "0") {
			window.onbeforeunload = () => {
				if (State.get().resource) {
					return "If you leave this page you will lose any unsaved changes.";
				}
			};
		}

		const defaultProfilePath = "profiles/r4.json";

		return State.on("update", () => this.forceUpdate()).emit("load_initial_json",
			qs.profiles || defaultProfilePath,
			qs.resource, this.isRemote);
	}

	handleOpen() {
		return State.emit("set_ui", "open");
	}
	
	handleCpg() {
		return State.trigger("set_ui", "cpg");
	}

	render() {
		let bundleBar;
		const state = State.get();

		if (state.bundle) {
			bundleBar = <BundleBar bundle={state.bundle} />;
		}
		
		const resourceContent = (() => {
			if (state.ui.status === "loading") {
			return <div className="spinner"><img src="../img/ajax-loader.gif" /></div>;
		} else if (state.resource) {
			return <DomainResource node={state.resource} />;
		} else if (!state.bundle && (state.ui.status.indexOf("error") === -1)) {
			return <div className="row" style={{marginTop: "60px", marginBottom: "60px"}}><div className="col-xs-offset-4 col-xs-4">
				<button className="btn btn-primary btn-block" onClick={this.handleOpen.bind(this)}>
					Open Resource
				</button>
				<button className="btn btn-primary btn-block" onClick={this.handleCpg.bind(this)}>
					CPG
				</button>
			</div></div>;
		}
		})();

		const error = (() => {
			if (state.ui.status === "profile_load_error") {
			return <div className="alert alert-danger">An error occured loading the FHIR profiles.</div>;
		} else if (state.ui.status === "resource_load_error") {
			return <div className="alert alert-danger">An error occured loading the resource.</div>;
		} else if (state.ui.status === "validation_error") {
			return <div className="alert alert-danger">Please fix errors in resource before continuing.</div>;
		}
		})();

                //actionWarning = if state.ui.status is "ref_warning"
                //	<RefWarning count={state.ui.count}, update={state.ui.update} />

		const navBar = this.isRemote ?
			<RemoteNavbar
				hasResource={state.resource ? true : undefined}
				appVersion={this.appVersion} 
				hasProfiles={state.profiles !== null}
			/>
		:
			<NavbarFred hasResource={state.resource ? true : undefined} appVersion={this.appVersion} />;
		
		return <div>
			{navBar}
			<div className="container" style={{marginTop: "100px", marginBottom: "50px"}}>
				{bundleBar}
				{error}
				{resourceContent}
				<Footer />
			</div>
			<OpenDialog 
				show={state.ui.status === "open"}
				openMode={state.ui.openMode}
				/>
			<CpgDialog
				show={state.ui.status == "cpg"}
				openMode={state.ui.openMode}			
				/>
			<ExportDialog show={state.ui.status === "export"}
				bundle={state.bundle}
				resource={state.resource}
			/>
			<CodePickerDialog show={state.ui.status === "codePicker"} node={state.ui.selectedNode} />
			<UserSettingsDialog show={state.ui.status === "settings"} />
		</div>;
	}
}

ReactDOM.render(<RootComponent />, document.getElementById("content"));