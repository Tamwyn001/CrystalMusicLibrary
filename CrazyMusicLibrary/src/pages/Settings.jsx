import { IconArrowBackUp, IconPrismLight } from "@tabler/icons-react";
import Header from "../components/Header.jsx";
import './Account.css';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiBase from "../../APIbase.js";
import UserSettingEntry from "./UserSettingEntry.jsx";
import { asVerified, verifyToken } from "../../lib.js";


const Settings = () => {
    const [isAdmin, setIsAdmin] = useState(false)
    useEffect( ()=>{
        const verify = asVerified(() => {
            fetch(`${apiBase}/auth/is-admin`, {
                method: 'POST',
                credentials: 'include'
            })
            .then(res => {
                return res.json()
            })
            .then(data => {setIsAdmin(data);})
        });
        verify();
    },[])
    const navigate = useNavigate();
    return (
        <div className="account-page">
            < Header/>
            <div className="account-content">
                <button className="roundButton go-back" onClick={() => navigate('/home')}>
                    <IconArrowBackUp />
                </button>
                <div className="account-info">
                    <h1>Settings page</h1>
                    <p>A shinny list of fancy settings.</p>

                    <div className="admin-settings-list">
                        <UserSettingEntry 
                            linkedSettingKey={"FFT"}
                            entryName={"Audio spectra"} 
                            entryIcon={<IconPrismLight/>}/> 
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;