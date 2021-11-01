/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from 'react';
import State from './state';
import {DropdownButton, Dropdown, Col} from 'react-bootstrap';

class BundleBar extends React.Component {

	shouldComponentUpdate(nextProps) {
		return nextProps.bundle !== this.props.bundle;
	}

	handleNav(pos, e) {
		e.preventDefault();
		return State.emit("set_bundle_pos", pos);
	}

	handleMenu(e, item) {
		return State.emit(e);
	}

	renderEmptyBundle() {
		return <div className="alert alert-danger">An error occured loading the resource.</div>;
	}

	handleInsert(e) {
        e.preventDefault();
        return State.emit("show_open_insert");
    }

    handleDuplicate(e) {
        e.preventDefault();
        return State.emit("clone_resource");
    }

    handleRemove(e) {
        e.preventDefault();
        return State.emit("remove_from_bundle");
    }

    clicked(e) {
        if(confirm('Are you sure you want to remove this resource from bundle?')) {
            e.preventDefault();
            return State.emit("remove_from_bundle");
        }
    }

	renderBar() {
		const pos = this.props.bundle.pos+1;
		const count = this.props.bundle.resources.length;
		const title = `Bundled Resource ${pos} of ${count}`;
		const resources = this.props.bundle.resources;

		return <div className="row" style={{textAlign: "center"}}>
			<form className="navbar-form">

			<DropdownButton size="sm" 
                    className="btn"
                    title={title} 
                    align="end"
                    style={{marginRight: "-3px"}}
                    onSelect={this.handleMenu.bind(this)}
            >
				{resources.map((resource, i) => {
					const className = (() => {
						if (resource.resourceType === "PlanDefinition") {
						return "far fa-folder-open";
					} else if (resource.resourceType.endsWith("Activity")) {
						return "far fa-file-alt";
					} else if (resource.resourceType === "Library") {
						return "fas fa-book-medical";
					}
					})();

					return (
					<Dropdown.Item 
						onClick={this.handleNav.bind(this, i)}
						key = {resource.id}
					>
						<span className={className} style={{marginRight:"10px"}}></span> {resource.title}
					</Dropdown.Item>
					)}
				)}

            </DropdownButton>
			
				<button
                    className="btn btn-primary btn-sm"
                    onClick={this.handleInsert.bind()}
                >
                    Insert Resource
                </button>&nbsp;

                <button
                    className="btn btn-primary btn-sm"
                    onClick={this.handleDuplicate.bind()}
                >
                    Duplicate Resource
                </button>&nbsp;

                <button
                    className="btn btn-primary btn-sm"
                    disabled={pos === 1}
                    onClick={this.clicked.bind()}
                >
                    Remove from Bundle
                </button>&nbsp;
                
                {/* <button className="btn btn-default btn-sm" 
                    disabled={pos === 1} 
                    style={{marginRight: "10px"}}
                    onClick={this.handleNav.bind(this, 0)}
                >
                    <i className="fas fa-step-backward" />
                </button>

                <button className="btn btn-default btn-sm" 
                    disabled={pos === 1} 
                    onClick={this.handleNav.bind(this, this.props.bundle.pos-1)}
                >
                    <i className="fas fa-chevron-left" />
                </button> */}

                {/* <button className="btn btn-default btn-sm" 
                    disabled={pos === count} 
                    onClick={this.handleNav.bind(this, this.props.bundle.pos+1)}
                >
                    <i className="fas fa-chevron-right" />
                </button>

                <button className="btn btn-default btn-sm" 
                    disabled={pos === count} 
                    onClick={this.handleNav.bind(this, count-1)}
                    style={{marginLeft: "10px"}}
                >
                    <i className="fas fa-step-forward" />
                </button> */}

            </form>
        </div>;
    }

	render() {
		if (this.props.bundle.resources.length > 0) {
			return this.renderBar();
		} else {
			return this.renderEmptyBundle();
		}
	}
}

export default BundleBar;

function __guard__(value, transform) {
    return typeof value !== "undefined" && value !== null
        ? transform(value)
        : undefined;
}