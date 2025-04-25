
import {Link} from 'react-router-dom'
import StatShort from './StatsShort'
import './Sidebar.css'
import { IconPlaylist, IconAlbum, IconList, IconChefHat } from '@tabler/icons-react';

const Sidebar = () => {

    return(
        <div className="sidebar">
            <nav>
                <Link to="/"><IconAlbum/>Recent</Link> 
                <Link to="/playlists"><IconPlaylist/>Playlists</Link>
                <Link to="/artists"><IconChefHat/>Artists</Link>
                <Link to="/genres"><IconList/>Genres</Link>
            </nav>
            <StatShort />
        </div>


    )
}
export default Sidebar