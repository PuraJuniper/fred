/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import State from "../state";
import {Dropdown} from "react-bootstrap";

class ElementMenu extends React.Component {

	shouldComponentUpdate(nextProps) {
		return nextProps.node?.ui?.menu !== this.props.node?.ui?.menu;
	}

	handleToggle(show) {
		if (show) {
			return State.emit("show_object_menu", this.props.node, this.props.parent);
		}
	}

	handleAddItem(unused) {
		return State.emit("add_object_element", this.props.node, unused);
	}

	handleAddObject(e) {
		State.emit("add_array_object", this.props.node);
		return e.preventDefault();
	}

	handleCodePicker(e) {
		State.emit("show_code_picker", this.props.node);
	}

	handleMove(down, e) {
		State.emit("move_array_node", this.props.node, this.props.parent, down);
		return e.preventDefault;
	}

	handleDeleteItem(e) {
		State.emit("delete_node", this.props.node, this.props.parent);
		return e.preventDefault();
	}

	preventDefault(e) {
		return e.preventDefault();
	}


	render() {
		return <Dropdown id="element-menu" onToggle={this.handleToggle.bind(this)}>
			{this.renderToggle()}
			{this.renderMenu()}
		</Dropdown>;
	}

	renderToggle() {
		let className, title;
		if (this.props.display === "inline") {
			className = "inline-menu-toggle";
			title = this.props.node.displayName;
	
		} else if (this.props.display === "heading") {
			className = "heading-menu-toggle";
			title = this.props.parent.displayName;
		}

		return <Dropdown.Toggle variant="outline-dark" className={className} size="sm" title={title || "Add Element"}>{title || "Add Element"}</Dropdown.Toggle>;
	}

	renderPlaceholder() {
		return <Dropdown.Menu style={{margin: "0px"}}><Dropdown.Item>Loading...</Dropdown.Item></Dropdown.Menu>;
	}

	renderMenu() {
		if (this.props.node?.ui?.status !== "menu") {
			return this.renderPlaceholder(); 
		}

		const addObject = this.props.node.nodeType === "objectArray" ?
			<Dropdown.Item onSelect={this.handleAddObject.bind(this)}>Add {this.props.node.displayName}</Dropdown.Item> : undefined;
		// For FHIR type `Coding`, we provide the user with an option to input a valid system and code
		//  so that the rest of the fields may be autopopulated using VSAC
		const codePicker = this.props.node.fhirType == "Coding" ? <Dropdown.Item onSelect={this.handleCodePicker.bind(this)}>VSAC Code Picker</Dropdown.Item> : undefined;
		const moveUp = this.props.node.ui.menu.canMoveUp ?
			<Dropdown.Item onSelect={this.handleMove.bind(this, false)}>Move Up</Dropdown.Item> : undefined;
		const moveDown = this.props.node.ui.menu.canMoveDown ?
			<Dropdown.Item onSelect={this.handleMove.bind(this, true)}>Move Down</Dropdown.Item> : undefined;
		let unusedElements = (() => {
			const result = [];
			const iterable = this.props.node.ui.menu.unusedElements || [];
			for (let i = 0; i < iterable.length; i++) {
				const unused = iterable[i];
				const required = unused.isRequired ? "*" : "";
				result.push(<Dropdown.Item key={i} onSelect={this.handleAddItem.bind(this, unused)}>
					{unused.displayName + (required || "")}
				</Dropdown.Item>);
			}
			return result;
		})();
		const remove = this.props.parent ?
			<Dropdown.Item onSelect={this.handleDeleteItem.bind(this)}>Remove</Dropdown.Item> : undefined;
		// TODO: figure out why adding `="true"` suppresses warnings
		let spacer1 = (addObject || remove) ?
			<Dropdown.Item divider="true" /> : undefined;
		let spacer2 = (moveUp || moveDown) && (unusedElements?.length > 0) ?
			<Dropdown.Item divider="true" /> : undefined;
		let header = (unusedElements?.length > 0) && this.props.parent ?
			<Dropdown.Item header="true">Add Item</Dropdown.Item> : undefined;

		//handle empty contained resources
		if (this.props.node?.fhirType === "Resource") {
			header = (unusedElements = (spacer1 = (spacer2 = null)));
		}

		return <Dropdown.Menu style={{margin: "0px"}}>
			{remove}{addObject}
			{spacer1}{moveUp}{moveDown}
			{spacer2}{header}{codePicker}{unusedElements}
		</Dropdown.Menu>;
	}
}

export default ElementMenu;