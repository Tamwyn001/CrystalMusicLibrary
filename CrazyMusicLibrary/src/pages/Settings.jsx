import { IconArrowBackUp } from "@tabler/icons-react";
import Header from "../components/Header";
import './Account.css';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiBase from "../../APIbase";


const Settings = () => {
    const [isAdmin, setIsAdmin] = useState(false)
    useEffect(()=>{
        fetch(`${apiBase}/auth/is-admin`, {
            method: 'POST',
            credentials: 'include'
        })
        .then(res => res.json())
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
                    <h1>Settings page {`${isAdmin}`}</h1>
                    <p>A shinny list of fancy settings.</p>
                </div>
            </div>
        </div>
    );
}

export default Settings;