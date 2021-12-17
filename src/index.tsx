/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import { UncontrolledAlert } from 'reactstrap';
import ReactDOM from "react-dom";
import State from "./reactions";
import * as SchemaUtils from "./helpers/schema-utils";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCaretRight, faCaretLeft} from  '@fortawesome/pro-solid-svg-icons';

import NavbarFred from "./navbar";
import RemoteNavbar from "./remote-navbar";
import BundleBar from "./bundle-bar";
import RefWarning from "./ref-warning";
import Footer from "./footer";
import SelectView from "./simplified/selectView"
import Collection from "./simplified/collection"
import { SimpleForm } from "./simplified/simpleForm";

import DomainResource from "./domain-resource/";
import CpgDialog from "./dialogs/cpg-dialog";
import OpenDialog from "./dialogs/open-dialog";
import ExportDialog from "./dialogs/export-dialog";
import CodePickerDialog from "./dialogs/code-picker-dialog";
import ChangeProfileDialog from "./dialogs/change-profile-dialog";
import ValueSetDialog from "./dialogs/valueset-dialog"
import UserSettingsDialog from "./dialogs/user-settings-dialog";

import AppInfo from "../package.json";
import SelectResourceDialog from "./dialogs/select-resource-canonical-dialog";

interface RootProps {};
const changeLessContentStatuses = ["closedialog", "open", "basic-cpg", "advanced-cpg", "export"]
class RootComponent extends React.Component<RootProps, {prevStatus:string}> {
	appVersion: string;
	isRemote: boolean;

	constructor(props: RootProps) {
		super(props);
		const versionSegments = AppInfo.version.split(".");
		//only take the major and minor
		this.appVersion = versionSegments.slice(0,versionSegments.length-1).join(".");
		this.isRemote = false;
		this.state = {
			prevStatus: ""
		}
		
	}

	getQs() {
		const data: any = {};
		const params = window.document.location.search?.substr(1).split("&");
		for (let param of Array.from(params)) {
			const [k,v] = param.split("=");
			data[k] = decodeURIComponent(v);
		}
		return data;
	}

	shouldComponentUpdate() {
		return this.state.prevStatus !== State.get().ui.status;
	}

	componentDidMount() {
		const qs = this.getQs();

		if (qs.remote === "1") {
			this.isRemote = true;
		}

		if (qs.warn !== "0") {
			window.onbeforeunload = () => {
				if (State.get().bundle) {
					return "If you leave this page you will lose any unsaved changes.";
				}
			};
		}

		const defaultProfilePath = "profiles/cpg.json";

		return (State.on("update", () => this.forceUpdate()) as any).emit("load_initial_json",
			qs.profiles || defaultProfilePath,
			qs.resource, this.isRemote);
	}

	getSnapshotBeforeUpdate() {
		return window.pageYOffset;
	}

	componentDidUpdate(prevProps: RootProps, prevState: RootProps, snapshot: any) {
		if (!changeLessContentStatuses.includes(State.get().ui.status)) {
			this.setState({prevStatus:State.get().ui.status});
		}
		window.scrollTo(0, snapshot);
	} 

	handleOpen() {
		return State.emit("set_ui", "open");
	}
	
	handleCpg() {
		return State.emit("set_ui", "cpg");
	}

	handleSelect() {
		return State.emit("set_ui", "select");
	}

	render() {
		let bundleBar;
		const state = State.get();
		const prevStatus = this.state.prevStatus;
		console.log(state.bundle?.resources);

		if (state.bundle && state.mode !== "basic") {
			bundleBar = <BundleBar bundle={state.bundle} />;
		}

		const resourceContent = (() => {
			if (state.ui.status === "loading") {
			return <div className="spinner"><img src="../img/ajax-loader.gif" /></div>;
		} else if (state.ui.status === "cards" || 
				prevStatus === "cards" && changeLessContentStatuses.includes(state.ui.status)) {
			return <SelectView />
		} else if (state.ui.status === "collection" || 
				prevStatus === "collection" && changeLessContentStatuses.includes(state.ui.status)) {
			return <Collection />
		} else if (state.bundle) {
			return (
					state.mode === "basic" ? 
					<SimpleForm actNode={state.bundle.resources[state.bundle.pos]} planNode={state.bundle.resources[state.bundle.pos+1]}/> : 
					<DomainResource node={state.bundle.resources[state.bundle.pos]} errFields={state.errFields}/>
			);
		} else if (!state.bundle && (state.ui.status.indexOf("error") === -1)) {
			return <div className="row" style={{marginTop: "60px", marginBottom: "60px"}}><div className="col-xs-offset-4 col-xs-4">
				<button className="btn btn-primary btn-block" onClick={this.handleOpen.bind(this)}>
					Create Resource
				</button>
				<button className="btn btn-primary btn-block" onClick={(e) => {
					State.emit("set_ui", "basic-cpg");
					}}>
					Basic CPG
				</button>
				<button className="btn btn-primary btn-block" onClick={(e) => {
					State.emit("set_ui", "advanced-cpg");
				}
					}>
					Advanced CPG
				</button>
			</div></div>;
		}
		})();

		const error = (() => {
			if (state.ui.status === "profile_load_error") {
			return (
				<UncontrolledAlert color="danger">An error occured loading the FHIR profiles.</UncontrolledAlert>
				);
		} else if (state.ui.status === "resource_load_error") {
			return (
				<UncontrolledAlert color="danger">An error occured loading the resource.</UncontrolledAlert>
				);
		} else if (state.ui.status === "validation_error") {
			return (
				<UncontrolledAlert color="danger">Please fix errors in resource before continuing.</UncontrolledAlert>
				);
		} else if (state.ui.status === "id_duplicate_error") {
			return (
				<UncontrolledAlert color="danger">This resource has a duplicate ID.</UncontrolledAlert>
				);
		} else if (state.ui.status === "title_duplicate_error") {
			return (
				<UncontrolledAlert color="danger">This resource has a duplicate title.</UncontrolledAlert>
				);
		} else if (state.ui.status === "url_duplicate_error") {
			return (
				<UncontrolledAlert color="danger">This resource has a duplicate url.</UncontrolledAlert>
				);
		} else if (state.ui.status === "missing_title_error") {
			return (
				<UncontrolledAlert color="danger">This resource needs a title.</UncontrolledAlert>
				);
		}
		})();

                //actionWarning = if state.ui.status is "ref_warning"
                //	<RefWarning count={state.ui.count}, update={state.ui.update} />

		const navBar = this.isRemote ?
			<RemoteNavbar
				hasResource={state.bundle ? true : undefined}
				appVersion={this.appVersion} 
				hasProfiles={state.profiles !== null}
			/>
		:
			<NavbarFred hasResource={state.bundle ? true : undefined} appVersion={this.appVersion} />;
		
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
				show={["basic-cpg", "advanced-cpg"].includes(state.ui.status)}
				basic={state.ui.status === "basic-cpg"}	
				/>
			{state.bundle ? 
			<>
				<ExportDialog show={state.ui.status === "export"} bundle={state.bundle} />
				<ChangeProfileDialog show={state.ui.status === "change_profile"} nodeToChange={state.bundle.resources[state.bundle.pos]}
					profiles={state.profiles}/>
				<ValueSetDialog show={state.ui.status === "valueSet"} node={state.ui.selectedNode} 
					profile={state.bundle.resources[state.bundle.pos].profile} valueset={state.valuesets} />
				<SelectResourceDialog show={state.ui.status === "select"} node={state.ui.selectedNode} 
					bundle = {state.bundle} /> 
				<CodePickerDialog show={state.ui.status === "codePicker"} node={state.ui.selectedNode} />
			</>
			: ""
			}
			<UserSettingsDialog show={state.ui.status === "settings"} />
		</div>;
	}
}

ReactDOM.render(<RootComponent />, document.getElementById("content"));