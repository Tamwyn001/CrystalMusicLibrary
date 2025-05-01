import { useEffect, useState } from "react";
import apiBase from "../../APIbase";
import Header from "../components/Header";
import { IconArrowBackUp } from "@tabler/icons-react";
import UserAccountInfosEntry from "../components/UserAccountInfosEntry";
import { useNavigate } from "react-router-dom";
import './adminPannel.css';

const AdminPannel = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [totalStorage, setTotalStorage] = useState(0);
    const navigate = useNavigate();
    useEffect(()=>{
        fetch(`${apiBase}/auth/is-admin`, {
            method: 'POST',
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {setIsAdmin(data);})
    },[]);
    
    useEffect(() => {
        if(!isAdmin) return;
        fetch(`${apiBase}/auth/init-admin-pannel`, {
            method: 'POST',
            credentials: 'include'
        }).then(res => res.json())
        .then(data => {
            setAllUsers(data.users);
            setTotalStorage(data.totalStorage);
        })
    },[isAdmin]);

    const NotAuthorized = () => {
        return (
            <div>
                <h1>Access Denied</h1>
                <p>You are not an admin.</p>
            </div>
        );
    }
    const AdminPannel = () => {
        return (
            <div>
                <h1>Admin pannel</h1>
                <p>Only for the true admins.</p>
                <div className="all-users-list">
                    {allUsers.map((user) => (<UserAccountInfosEntry key={user.id} user={user} totalStorage={totalStorage}/>))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="account-page">
            < Header/>
            <div className="account-content">
                <button className="roundButton" onClick={() => navigate('/home')}>
                    <IconArrowBackUp />
                </button>
                <div className="account-info">
                    {isAdmin ? <AdminPannel /> : <NotAuthorized />}
                </div>
            </div>
        </div>
    );
}

export default AdminPannel;