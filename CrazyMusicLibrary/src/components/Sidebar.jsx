
import {Link} from 'react-router-dom'
import StatShort from './StatsShort'
import './Sidebar.css'
import { IconPlaylist, IconAlbum, IconList, IconChefHat, IconSalad, IconCommand, IconTerminal2 } from '@tabler/icons-react';
import { useGlobalActionBar } from '../GlobalActionBar';

const Sidebar = () => {
    const { openCommands } = useGlobalActionBar();
    return(
        <div className="sidebar">
            <nav>
                <Link to="/home"><IconAlbum/>Recent</Link> 
                <Link to="/playlists"><IconPlaylist/>Playlists</Link>
                <Link to="/artists"><IconChefHat/>Artists</Link>
                <Link to="/genres"><IconList/>Genres</Link>
                <Link to="/cooking"><IconSalad/>Cooking</Link>
            </nav>
            <StatShort />
            <div className="serach-button-div" onClick={openCommands} style={{margin : "auto", marginBottom:"20px"}}>
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