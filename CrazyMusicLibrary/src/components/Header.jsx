import './Header.css'
import logoURL from '../assets/CML_logo.svg'
import UserDropdown from './UserDropdown'
import { IconMusicPlus, IconMountain, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react'
import SongProgress from './SongProgress'
import { useState } from 'react'
import AddMusic from './AddMusic'


const Header = () => {
    const [pausePlayVisible, setPausePlayVisible] = useState(false)
    const [musicPaused, setMusicPaused] = useState(false)

    const [newMusicShown, setNewMusicShown] = useState(false)
    function playPauseVisibility(visible){
        setPausePlayVisible(visible);
        console.log('AAA');
        if(visible){
            document.querySelector('.trackImage').setAttribute('hovered','hovered');
        }else{
            document.querySelector('.trackImage').removeAttribute('hovered');
        }
    }

    function openNewMusic (){
        setNewMusicShown(true);
    }

    const closeNewMusic = () => {
        setNewMusicShown(false);
    }

    return(
    
    <header className="header">
        <div className="header__logo">
            <img src={logoURL} alt="CML logo" className="logoHeader"/>
            <h1>CML</h1>
        </div>
        <div className="musicPlayer">
            <div className='playPauseContainer'>
                <IconMountain className="trackImage" />
                <div className="playPauseButtons">
                    {musicPaused ? (
                        <IconPlayerPlay onClick={() => setMusicPaused(false)} onMouseEnter={() => playPauseVisibility(true)} onMouseLeave={() => playPauseVisibility(false)} />
                    ) : (
                        <IconPlayerPause onClick={() => setMusicPaused(true)} onMouseEnter={() => playPauseVisibility(true)} onMouseLeave={() => playPauseVisibility(false)} />
                    )}
                </div>
            </div>
            <div className='trackinfos'>
                <p id="songTitle">Song Title</p>
                <SongProgress />
            </div>
        </div>
        <div className="headerRight">
            <IconMusicPlus className="addMusicButton buttonRound" onClick={() => openNewMusic()}/>
            <UserDropdown />
        </div>
        {newMusicShown && (<AddMusic closeOverlay={closeNewMusic} />) }
      </header>    
    )
}

export default Header