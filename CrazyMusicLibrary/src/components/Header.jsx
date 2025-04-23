import './Header.css'
import UserDropdown from './UserDropdown'
import { IconMusicPlus, IconMountain, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react'
import SongProgress from './SongProgress'
import { useEffect, useState } from 'react'
import AddMusic from './AddMusic'
import { useAudioPlayer } from '../GlobalAudioProvider'
import AudioControls from './AudioControls'
import CML_logo from './CML_logo.jsx'


const Header = () => {
    const [pausePlayVisible, setPausePlayVisible] = useState(false)
    const [musicPaused, setMusicPaused] = useState(false)
    const [newMusicShown, setNewMusicShown] = useState(false)
    const [logoColors, setLogoColors] = useState({col1: '#000', col2: '#000'})
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
    useEffect(() => {
        const colors = [{
            col1: "#ffa585",
            col2: "#ffeda0"
        },
        {
            col1: "#9bf8f4",
            col2: "#6f7bf7"
        }
    ];
        setLogoColors(colors[Math.floor(Math.random() * colors.length)])
    }, []);
    return(

    <header className="header">
        <div className="header__logo">
            <CML_logo col1={logoColors.col1} col2={logoColors.col2}/>
            <h1>CML</h1>
        </div>
        <AudioControls context={{mobile : false}}/>
        <div className="musicPlayer">
            <div className='playPauseContainer'>
                {(trackCoverUrl === 'null') ? <CML_logo  className="trackImage" />:  <img src={trackCoverUrl} className="trackImage" />}
               
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