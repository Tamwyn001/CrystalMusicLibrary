import './Header.css'
import UserDropdown from './UserDropdown.jsx'
import { IconMusicPlus, IconPlayerPlay, IconPlayerPause, IconListDetails, IconSearch, IconVolume, IconVolume3, IconVolume2, IconPrismLight, IconFrame, IconBoxAlignBottomFilled, IconContrast2, IconContrast, IconBrightness, IconStar, IconStarFilled, IconMaximize } from '@tabler/icons-react'
import SongProgress from './SongProgress'
import { useEffect, useRef, useState } from 'react'
import AddMusic from './AddMusic.jsx'
import { useAudioPlayer } from '../GlobalAudioProvider'
import AudioControls from './AudioControls'
import CML_logo from './CML_logo.jsx'
import MusicQueue from './MusicQueue.jsx'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGlobalActionBar } from '../GlobalActionBar.jsx'
import VolumeBar from './VolumeBar.jsx'
import RadialProgressBar from './RadialProgressBar.jsx'
import {useEventContext} from '../GlobalEventProvider.jsx'
import SmallFFTVisualizer from '../pages/SmallFFTVisualizer.jsx'
import ColorThemeButton from './ColorThemeButton.jsx'
import SvgHoverToggle from './SvgHoverToggle.jsx'
import { useNotifications } from '../GlobalNotificationsProvider.jsx'



const Header = () => {
    const [pausePlayVisible, setPausePlayVisible] = useState(false)
    const [musicPaused, setMusicPaused] = useState(false)
    const [newMusicActive, setNewMusicActive] = useState(false);
    const [queueShown, setQueueShown] = useState(false);
    const [volumeShown, setVolumeShown] = useState(false);
    const [logoColors, setLogoColors] = useState({col1: '#000', col2: '#000'})
    const {currentTrackData, trackCoverUrl, volume, toggleFullScreenView,
        toggleCurrentRadioToFavorites, openTrackMobileView,mobileMusicPlayRef } = useAudioPlayer();
    const { openSearchBar } = useGlobalActionBar();
    const [isAddMusicMinimized, setIsAddMusicMinimized] = useState(false); 
    const [uploadProgress, setUploadProgress] = useState(null) //{done : Numver, total: Number}
    const [uploadPercent, setUploadPercent] = useState(null) // Number
    const navigate = useNavigate();
    const { subscribe } = useEventContext();
    const colorThemeRef = useRef(null);
    const [location, setLocation] = useState(useLocation().pathname === "/admin-pannel" );

    function playPauseVisibility(visible){
        setPausePlayVisible(visible);
        if(visible){
            document.querySelector('.trackImage').setAttribute('hovered','hovered');
        }else{
            document.querySelector('.trackImage').removeAttribute('hovered');
        }
    }


    const openNewMusic = () => {
        setNewMusicActive(true);
    }

    useEffect(() => {
        
        const unsubscribeAddMusic = subscribe('openAddMusic', openNewMusic);
        return () => {unsubscribeAddMusic();}
    },[])

    const closeNewMusic = () => {
        setNewMusicActive(false);
        setUploadPercent(null);
        setUploadProgress(null);
    }

    function toggleQueueShown(){
        setQueueShown(!queueShown);
    } 

    function toggleVolumeShown(){
        setVolumeShown(!volumeShown);
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

    const onUploadFished = () => {
        setIsAddMusicMinimized(false);
        closeNewMusic();

    }
    const handleClicNewMusic = () => {
        if(!uploadProgress){
            if(newMusicActive){
                closeNewMusic()
                console.log("deactivate")
            }else{
                openNewMusic();
                console.log("activate")
            }
            
            return
        }
        setIsAddMusicMinimized(!(document.getElementsByClassName("addMusicContainer")[0] != null));
        console.log("toggle")
    }

    const handleToggleFullScreenView = (e) =>{
        e.stopPropagation()
        toggleFullScreenView();

    }

    return(

    <header className="header">
        <div className="header__logo" onClick={() => navigate('/home')}>
            <CML_logo col1={logoColors.col1} col2={logoColors.col2}/>
            <h1>CML</h1>    
        </div>
        <AudioControls context={{mobile : false}}/>
        <div className="musicPlayer" ref={mobileMusicPlayRef} onClick={openTrackMobileView}>
            <div className='playPauseContainer'>
                {(currentTrackData?.type == "radio") ? 
                ((currentTrackData.coverUrl == "") ? 
                    <CML_logo  className="trackImage" /> :
                    <img src={currentTrackData.coverUrl} className="trackImage" />
                ) :
                (trackCoverUrl.split('/').pop() === 'null') ?
                 <CML_logo  className="trackImage" />:
                  <img src={trackCoverUrl} className="trackImage" />}
               
                <div className="playPauseButtons" onClick={handleToggleFullScreenView}>
                    <IconMaximize style={{padding: "0px"}}/>
                </div>
            </div>
            {
                (!currentTrackData || Object.keys(currentTrackData).length === 0) ? null :
                <div className='trackinfos-parent'>
                    <div className='trackinfo-desktop'>
                        <span id="songTitle">{currentTrackData.title}</span>
                        <span id="songArtist" className="artist-name" style={{fontSize: '13px'}}
                        onClick={()=>{ if(currentTrackData?.type != "radio"){
                            navigate(`/artists/${currentTrackData.artistId}`)}}}>
                            {currentTrackData.artist}</span>
                        <SongProgress />
                    </div>
                    
                    {currentTrackData?.type === "radio" ? 
                    <SvgHoverToggle id="add-radio-fav" iconHovered={IconStarFilled} iconDefault={IconStar} onClick={toggleCurrentRadioToFavorites}/>
                        : <SmallFFTVisualizer/>}
                    <div className='trackinfo-mobile'>
                        <span id="songTitle">{currentTrackData.title}</span>
                        <AudioControls context={{mobile : true, radio : currentTrackData?.type === "radio" , preserv : true}}/>
                    </div>
                </div>

            }
        </div>
        <div className='mobile-gost'>
            <IconListDetails id="playlist-button" className="buttonRound" onClick={() => toggleQueueShown(true)}/>
            { queueShown && <MusicQueue hideComponent={() => setQueueShown(false)}/>}

            {(volume <= 1e-5 ) ? <IconVolume3 className="buttonRound" onClick={() => toggleVolumeShown(true)}/> 
            :(volume < 0.5 ) ? <IconVolume2 className="buttonRound" onClick={() => toggleVolumeShown(true)}/>
            : <IconVolume id="volume-button" className="buttonRound" onClick={() => toggleVolumeShown(true)}/>}
            { volumeShown && <VolumeBar hideComponent={() => setVolumeShown(false)}/>}
            <ColorThemeButton/>
        </div>
        
        <div className="headerRight">
        <ColorThemeButton className='desktop-ghost'/>
            {! location && (
                <div className="serach-button-div" onClick={openSearchBar}>
                <div className='keyboard-key'>
                    <span>CTRL</span>
                </div>
                <span>+</span>
                <div className='keyboard-key' style={{marginRight: 'auto'}}>
                    <span>K</span>
                </div>
                <IconSearch/>
            </div>
            )}
            <div style={{position : "relative" , padding : "5px", display: "flex", justifyContent: "center"}} className='upload-music-header'>
            {(uploadPercent) &&
                <RadialProgressBar percent={uploadPercent} size={44} useText={false} style={{position: "absolute", transform:"translate(-1px, -5.5px)"}}/>}
                <IconMusicPlus style={{zIndex:"10", position: "relative"}}className="addMusicButton buttonRound" onClick={handleClicNewMusic}/>
                
                {(uploadProgress) && <span id="upload-progress-tiny">{uploadProgress.done}/{uploadProgress.total}</span>
                }
            </div>
            <UserDropdown />
        </div>
        {newMusicActive && (<AddMusic 
            uploadPercent={setUploadPercent} 
            uploadFinished={onUploadFished} 
            uploadProgress={setUploadProgress}
            isMinimize={isAddMusicMinimized}
            setMinimized={setIsAddMusicMinimized}
            closeOverlay={closeNewMusic} />) }

      </header>    
    )
}

export default Header