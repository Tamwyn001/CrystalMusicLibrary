import { useEffect, useMemo, useRef, useState } from "react";
import FFTSettingsUser from "../components/UserSettings/FFTSettingsUser";

const settingComponents = {
    FFT: FFTSettingsUser,
    // Add more keys as needed
  };
  

const UserSettingEntry = ({entryName, entryIcon, linkedSettingKey}) => {
    const [extended, setExtended] = useState(false);
    const SettingComponent = useMemo(
            () => settingComponents[linkedSettingKey] || null,
        [linkedSettingKey]);
            
    return (
        <div className="admin-setting-entry" >
            <div className="admin-setting-entry-header" data-extended={extended}
            onClick={(e) => { 
                e.stopPropagation();
                setExtended(!extended)}}>
                {entryIcon} 
                <span>{entryName}</span>
            </div>
            <div className="admin-setting-content">
                {SettingComponent && extended && <SettingComponent />}
            </div>
        </div>
    );
}

export default UserSettingEntry;