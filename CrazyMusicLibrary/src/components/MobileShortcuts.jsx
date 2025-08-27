import { IconFrame, IconHome, IconMaximize, IconRadio, IconSearch } from '@tabler/icons-react'
import './MobileShortcuts.css'
import { useNavigate } from 'react-router-dom'
import { memo } from 'react';
    const Shortcut = memo(({path,display, Icon}) => {
        const navigate = useNavigate();
        return <div className='mobile-shortcut-entry'>
            <Icon onClick={()=>{navigate(path)}}/>
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