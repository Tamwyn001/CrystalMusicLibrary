import { IconArrowBackUp } from "@tabler/icons-react";
import Header from "../components/Header.jsx";
import './Account.css';
import { useEffect, useState } from "react";
import CML_logo from "../components/CML_logo.jsx";
import { useNavigate } from "react-router-dom";
const Account = () => {
    const [userName, setUserName] = useState('');
    useEffect(() => {
        setUserName(localStorage.getItem('username'));
    },[]);
    const navigate = useNavigate();
    return (
        <div className="account-page">
            < Header/>
            <div className="account-content">
                <button className="roundButton" onClick={() => navigate('/home')}>
                    <IconArrowBackUp />
                </button>
                <div className="account-container">
                    <div className="account-info">
                        <h1>{userName}</h1>
                        <p>Account information will be displayed here.</p>
                    </div>
                    <CML_logo/>
                </div>
            </div>
        </div>
    );
}

export default Account;