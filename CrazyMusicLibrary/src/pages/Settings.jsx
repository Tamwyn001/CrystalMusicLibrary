import { IconArrowBackUp, IconPrismLight } from "@tabler/icons-react";
import Header from "../components/Header";
import './Account.css';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiBase from "../../APIbase";
import UserSettingEntry from "./UserSettingEntry";


const Settings = () => {
    const [isAdmin, setIsAdmin] = useState(false)
    useEffect(()=>{
        fetch(`${apiBase}/auth/is-admin`, {
            method: 'POST',
            credentials: 'include'
        })
        .then(res => {
            if(!res.ok)
            {
                fetch(`${apiBase}/auth/logout`, {method: 'POST', credentials: 'include'})
                .then((response) => {
                    if (response.ok) {
                        window.location.href = '/';
                    } else {
                        console.error('Logout failed');
                    }
                })
            }
            return res.json()
        })
        .then(data => {setIsAdmin(data);})
    },[])
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