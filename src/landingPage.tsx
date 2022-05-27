import React from "react";
import State from "./state";
import { useNavigate } from "react-router-dom";
import {Navbar, Nav, NavItem} from 'react-bootstrap';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <Navbar className="navbar-custom"><Navbar.Brand>
                <img alt="Sage Logo" src="../img/WhiteSAGELogo-colour.png" height="30"/>
            </Navbar.Brand></Navbar>
            <div className="container">
                <div className="row justify-content-md-center" style={{ marginTop: 40, marginBottom: 40 }}>
                    <div className="col-lg-1"></div>
                    <div className="col-lg-2 ">
                        <img src="../img/Juniper-CDS-colour.png" className="img-thumbnail" style={{ border: 0 }} />
                    </div>
                    <div className="col-lg-1"></div>
                </div>
                <div className="row justify-content-md-center">
                    <div className="col col-lg-1 bg-sage-darkpurple"></div>
                    <div className="col-lg-2 bg-sage-darkpurple text-center">
                        <p style={{ marginTop: 60 }}><span style={{ color: "#E0C758", textAlign: "center", fontWeight: "bold" }}>Choose Account</span></p>
                    </div>
                    <div className="col col-lg-1 bg-sage-darkpurple"></div>
                </div>
                <div className="row justify-content-md-center">
                    <div className="col-lg-1 bg-sage-darkpurple"></div>
                    <div className="col-lg-2 bg-sage-darkpurple">
                        <button className="btn btn-secondary btn-block" style={{ marginTop: 60, width: "100%" }} onClick={(e) => {
                            State.get().bundle?.set("resources", []);
                            State.get().set("mode", "basic");
                            navigate('/basic-home');
                        } }>
                            Basic CPG
                        </button>
                    </div>
                    <div className="col-lg-1 bg-sage-darkpurple"></div>
                </div>
                <div className="row justify-content-md-center">
                    <div className="col-lg-1 bg-sage-darkpurple"></div>
                    <div className="col-lg-2 bg-sage-darkpurple">
                        <button className="btn btn-secondary btn-block" style={{ marginTop: 10, marginBottom: 100, width: "100%" }} onClick={(e) => {
                            State.get().ui.set("status", "advanced-cpg");
                            State.get().set("mode", "advanced");
                        } }>
                            Advanced CPG
                        </button>
                    </div>
                    <div className="col-lg-1 bg-sage-darkpurple"></div>
                </div>
            </div>
        </>
    );
}
