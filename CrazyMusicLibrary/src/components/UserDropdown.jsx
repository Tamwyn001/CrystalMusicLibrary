import { useState } from "react";
import'./UserDropdown.css'
import { IconUserScreen } from "@tabler/icons-react";
const userDropdown = () =>{
    const [isOpened, setIsOpened] = useState(false);

    function toggleDropdown() {
        setIsOpened(!isOpened);
    }
    const UserImage = () => {
        return(<IconUserScreen className="userImage buttonRound" onClick={toggleDropdown}/>)
    }
    function logout() {
        fetch('http://localhost:4590/auth/logout', {method: 'POST', credentials: 'include'})
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
    return (
        <div className="userDropdown">
          <UserImage />
          {isOpened && (
            <div className="dropdown">
              <button className="userAccount dropdownEntry">Account</button>
              <button className="userSetting dropdownEntry">Settings</button>
              <button className="userLogout dropdownEntry" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      );
}

export default userDropdown