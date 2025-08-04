
import {Link} from 'react-router-dom'
import StatShort from './StatsShort'
import './Sidebar.css'
import { IconPlaylist, IconAlbum, IconList, IconChefHat, IconSalad, IconCommand, IconTerminal2, IconRadioOff, IconRadio, IconSend, IconAntenna, IconTelescope, IconAntennaBars4 } from '@tabler/icons-react';
import { useGlobalActionBar } from '../GlobalActionBar';

const Sidebar = () => {
    const { openCommandBar } = useGlobalActionBar();
    return(
        <div className="sidebar">
            <nav>
                <Link id="nav-recent" to="/home"><IconAlbum/>Recent</Link> 
                <Link to="/playlists"><IconPlaylist/>Playlists</Link>
                <Link to="/artists"><IconChefHat/>Artists</Link>
                <Link to="/genres"><IconList/>Genres</Link>
                <Link to="/cooking"><IconSalad/>Cooking</Link>
                <Link to="/radio"><IconTelescope/>Radio</Link>

            </nav>
            <StatShort />
            <div className="serach-button-div" onClick={openCommandBar} style={{margin : "auto", marginBottom:"20px"}}>
                <div className='keyboard-key'>
                    <span>CTRL</span>
                </div>
                <span>+</span>
                <div className='keyboard-key' style={{marginRight: 'auto'}}>
                    <span>SPACE</span>
                </div>
                <IconTerminal2/>
            </div>
        </div>


    )
}
export default Sidebar