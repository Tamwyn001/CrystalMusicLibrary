import './Header.css'
import logoURL from '../assets/CML_logo.svg'
import UserDropdown from './UserDropdown'
import { IconMusicPlus, IconMountain, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react'
import SongProgress from './SongProgress'
import { useState } from 'react'
import AddMusic from './AddMusic'
import { useAudioPlayer } from '../GlobalAudioProvider'
import AudioControls from './AudioControls'


const Header = () => {
    const [pausePlayVisible, setPausePlayVisible] = useState(false)
    const [musicPaused, setMusicPaused] = useState(false)
    const [newMusicShown, setNewMusicShown] = useState(false)

    const {currentTrackData, trackCoverUrl} = useAudioPlayer();
    function playPauseVisibility(visible){
        setPausePlayVisible(visible);
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

    const TrackOverlay = () =>{
        if (!currentTrackData || Object.keys(currentTrackData).length === 0){
            return null; // or some fallback UI
        }
        return(
        <div className='trackinfos-parent'>
            <div className='trackinfo-desktop'>
                <span id="songTitle">{currentTrackData.title}</span>
                <span id="songArtist">{currentTrackData.artist}</span>
                <SongProgress />
            </div>
            <div className='trackinfo-mobile'>
                <span id="songTitle">{currentTrackData.title}</span>
                <AudioControls context={{mobile : true}}/>
            </div>
        </div>)
    }

    return(
    
    <header className="header">
        <div className="header__logo">
            <img src={logoURL} alt="CML logo" className="logoHeader"/>
            <h1>CML</h1>
        </div>
        <AudioControls context={{mobile : false}}/>
        <div className="musicPlayer">
            <div className='playPauseContainer'>
                <img src={trackCoverUrl} className="trackImage" />
                <div className="playPauseButtons">
                    {musicPaused ? (
                        <IconPlayerPlay onClick={() => setMusicPaused(false)} onMouseEnter={() => playPauseVisibility(true)} onMouseLeave={() => playPauseVisibility(false)} />
                    ) : (
                        <IconPlayerPause onClick={() => setMusicPaused(true)} onMouseEnter={() => playPauseVisibility(true)} onMouseLeave={() => playPauseVisibility(false)} />
                    )}
                </div>
            </div>
            <TrackOverlay />
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