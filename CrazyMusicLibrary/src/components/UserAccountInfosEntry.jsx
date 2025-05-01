import { useEffect, useState } from 'react';
import './UserAccountInfosEntry.css';
import apiBase from '../../APIbase';
import ProgressBar from './ProgressBar';

const UserAccountInfosEntry = ({user, totalStorage}) => {
    const [userStorage, setUserStorage] = useState(0);
    useEffect (() => {
        fetch(`${apiBase}/read-write/user-data-usage/${user.id}`, {
            method: 'GET',
            credentials: 'include'
        }).then(res => res.json())
        .then(data => {
            setUserStorage(data);
        }).catch(err => {
            console.error("Error fetching user storage data: ", err);
        });
    }, []);
    return(
        <div className="user-account-infos-entry">
            <p>{user.username}</p>
            <p>{user.email}</p>
            <p>{user.role}</p>
            <ProgressBar percent={userStorage/totalStorage*100} fillColor='var(--cool-green)' showPercent={true} style={{maxWidth : '200px'}}/>
        </div>
        
    )
}
export default UserAccountInfosEntry;