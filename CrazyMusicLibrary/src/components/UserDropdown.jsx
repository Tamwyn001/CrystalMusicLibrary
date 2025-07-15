import { useEffect, useState } from "react";
import'./UserDropdown.css'
import { IconUserScreen } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import apiBase from "../../APIbase";

const userDropdown = () =>{
    const [isOpened, setIsOpened] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false)
    const navigate = useNavigate();
    function toggleDropdown() {
        setIsOpened(!isOpened);
    }
    const UserImage = () => {
        return(<IconUserScreen className="userImage buttonRound" onClick={toggleDropdown}/>)
    }
    const logout = () => {
        fetch(`${apiBase}/auth/logout`, {method: 'POST', credentials: 'include'})
        .then((response) => {
            if (response.ok) {
                window.location.href = '/';
            } else {
                console.error('Logout failed');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    const handleAccountClick = () => {
        navigate('/account');
    }
    const handleSettingsClick = () => {
        navigate('/settings');
    }
    
    useEffect(()=>{
        fetch(`${apiBase}/auth/is-admin`, {
            method: 'POST',
            credentials: 'include'
        })
        .then(res => res.json())
        // .then(res =>{
        //     // %{
        //     //     fetch(`${apiBase}/auth/logout`, {method: 'POST', credentials: 'include'})
        //     //     .then((response) => {
        //     //         if (response.ok) {
        //     //             window.location.href = '/';
        //     //         } else {
        //     //             console.error('Logout failed');
        //     //         }
        //     //     })
        //     // }
        // })
        .then(data => {setIsAdmin(data);})
    },[])
    return (
        <div className="userDropdown">
          <UserImage />
          {isOpened && (
            <div className="dropdown">

              <button className="userAccount dropdownEntry" onClick={handleAccountClick}>Account</button>
              <button className="userSetting dropdownEntry" onClick={handleSettingsClick}>Settings</button>
              {isAdmin && (<button className="userSetting dropdownEntry" onClick={() => {navigate('/admin-pannel')}}>Admin pannel</button>)}
              <button className="userLogout dropdownEntry" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      );
}

export default userDropdown