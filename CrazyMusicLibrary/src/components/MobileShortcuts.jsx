import { IconFrame, IconHome, IconMaximize, IconRadio, IconSearch } from '@tabler/icons-react'
import './MobileShortcuts.css'
import { useLocation, useNavigate } from 'react-router-dom'
import { memo } from 'react';
    const Shortcut = memo(({path,display, Icon}) => {
        const navigate = useNavigate();
        const location = useLocation();
        return <div className='mobile-shortcut-entry'
            data-active={location.pathname === path}
            onClick={()=>{navigate(path)}}>
            <Icon />
            <span>{display}</span>
        </div>
    })
const MobileShortcuts = () =>{
    return <div id="mobile-shortcut">
       <Shortcut path={'/home'} display={'Home'} Icon={IconHome}/>
       <Shortcut path={'/radio'} display={'Radio'} Icon={IconRadio}/>
       <Shortcut path={'/Search'} display={'Search'} Icon={IconSearch}/>

    </div>
}
export default MobileShortcuts