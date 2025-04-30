import './Header.css'
import UserDropdown from './UserDropdown'
import { IconMusicPlus, IconMountain, IconPlayerPlay, IconPlayerPause, IconListDetails } from '@tabler/icons-react'
import SongProgress from './SongProgress'
import { useEffect, useState } from 'react'
import AddMusic from './AddMusic'
import { useAudioPlayer } from '../GlobalAudioProvider'
import AudioControls from './AudioControls'
import CML_logo from './CML_logo.jsx'
import MusicQueue from './MusicQueue.jsx'
import { useNavigate } from 'react-router-dom'


const Header = () => {
    const [pausePlayVisible, setPausePlayVisible] = useState(false)
    const [musicPaused, setMusicPaused] = useState(false)
    const [newMusicShown, setNewMusicShown] = useState(false);
    const [queueShown, setQueueShown] = useState(false);
    const [logoColors, setLogoColors] = useState({col1: '#000', col2: '#000'})
    const {currentTrackData, trackCoverUrl} = useAudioPlayer();
    const navigate = useNavigate();
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

    function toggleQueueShown(){
        setQueueShown(!queueShown);
    } 

    const TrackOverlay = () =>{
        if (!currentTrackData || Object.keys(currentTrackData).length === 0){
            return null; // or some fallback UI
        }
        return(
        <div className='trackinfos-parent'>
            <div className='trackinfo-desktop'>
                <span id="songTitle">{currentTrackData.title}</span>
                <span id="songArtist" style={{fontSize: '13px'}}>{currentTrackData.artist}</span>
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
        <div className="header__logo" onClick={() => navigate('/home')}>
            <CML_logo col1={logoColors.col1} col2={logoColors.col2}/>
            <h1>CML</h1>
        </div>
        <AudioControls context={{mobile : false}}/>
        <div className="musicPlayer">
            <div className='playPauseContainer'>
                {(trackCoverUrl.split('/').pop() === 'null') ? <CML_logo  className="trackImage" />:  <img src={trackCoverUrl} className="trackImage" />}
               
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
        <div className='mobile-gost'>
            <IconListDetails id="playlist-button" className="buttonRound" onClick={() => toggleQueueShown(true)}/>
            { queueShown && <MusicQueue hideComponent={() => setQueueShown(false)}/>}
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