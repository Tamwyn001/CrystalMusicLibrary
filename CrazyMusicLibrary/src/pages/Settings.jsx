import { IconArrowBackUp } from "@tabler/icons-react";
import Header from "../components/Header";
import './Account.css';
import { useEffect, useState } from "react";
import CML_logo from "../components/CML_logo";
import { useNavigate } from "react-router-dom";
const Settings = () => {
    const navigate = useNavigate();
    return (
        <div className="account-page">
            < Header/>
            <div className="account-content">
                <button className="roundButton" onClick={() => navigate('/home')}>
                    <IconArrowBackUp />
                </button>
                <div className="account-info">
                    <h1>Settings page</h1>
                    <p>A shinny list of fancy settings.</p>
                </div>
            </div>
        </div>
    );
}

export default Settings;