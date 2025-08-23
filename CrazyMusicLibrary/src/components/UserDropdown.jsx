import { useEffect, useRef, useState } from "react";
import'./UserDropdown.css'
import { IconUserScreen } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import apiBase from "../../APIbase.js";
import { useEventContext } from "../GlobalEventProvider.jsx";

const userDropdown = () =>{
    const [isOpened, setIsOpened] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false)
    const navigate = useNavigate();
    const wrapperRef = useRef(null);
    const {subscribe} = useEventContext();
    const toggleDropdown = () => {
        setIsOpened(!isOpened);
    }

    const logout = () => {
        fetch(`${apiBase}/auth/logout`, {method: 'POST', credentials: 'include'})
        .then((response) => {
            if (response.ok) {
                navigate('/');
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
        .then(data => {setIsAdmin(data);});
        const handleClickedOutside = (e) =>{            
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                if(e.target.closest('svg')?.id === 'user-button' ){return;}
                setIsOpened(false);
            }}
        const unsubscribeActionBar = subscribe("action-bar-open", () => {setIsOpened(false)});
        document.addEventListener("mousedown", handleClickedOutside);
        document.addEventListener("touchstart", handleClickedOutside);
        return () => {
            unsubscribeActionBar();
            document.removeEventListener("mousedown", handleClickedOutside);
            document.removeEventListener("touchstart", handleClickedOutside);
        }
    },[]);

    return (
        <div className="userDropdown" ref={wrapperRef}>
          <IconUserScreen id="user-button" className="userImage buttonRound" onClick={toggleDropdown}/>
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