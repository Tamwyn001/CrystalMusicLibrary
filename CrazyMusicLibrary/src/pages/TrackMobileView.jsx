import { memo, useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from '../GlobalAudioProvider.jsx'
import './TrackMobileView.css'
import CML_logo from '../components/CML_logo.jsx';
import SongProgress from '../components/SongProgress.jsx';
import AudioControls from '../components/AudioControls.jsx';
import ButtonWithCallback from '../components/ButtonWithCallback.jsx';
import { IconArrowsShuffle2, IconListDetails, IconStar, IconStarFilled } from '@tabler/icons-react';
import { FixedSizeList as List } from 'react-window';
import MusicQueueEntry from '../components/MusicQueueEntry.jsx';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../GlobalNotificationsProvider.jsx';

const itemHeight = 50; // Height of each item in pixels
const height = 0; // window.screen.height - 500; // Height of the list in pixels
const SongTitleArtist = memo(({title, radio, artist, artistId, isMinimal, fn})=>{
    console.log("radio", radio);
    const navigate = useNavigate();
    const [isNew, setNew] = useState(true);
    useEffect(() => {
        setNew(true);
        const timer = setTimeout(() => setNew(false), 500);
        return () => clearTimeout(timer);
      }, [title]); 

    return (<div className='mobile-view-track-artist' 
        style={{"--item-align" : isMinimal ? "left" : "center" }}>
    <span id="songTitle" data-from-minimal={isMinimal} data-new={isNew}>{title}</span>
    <span id="songArtist" className="artist-name" style={{fontSize: '13px'}}
    onClick={()=>{ if(!radio){
        if(fn) fn();
        navigate(`/artists/${artistId}`)}}}>
        {artist}</span>
    </div>)
}, (prev, next) =>  
    prev.title === next.title &&
    prev.artist === next.artist &&
    prev.artistId === next.artistId &&
    prev.radio === next.radio 
);
const BAR_NUMBER = 5;
//Cant use useAudioPlayer here
const TrackMobileView = () =>{
    const {currentTrackData, trackCoverUrl,setTrackMobileView,toggleTrackFavorite,
        playQueue, jumpToQueueTrack, queuePointer, playLibraryShuffle,
        isPlaying, getFFTAtCurrentTime,fftConfigRef } = useAudioPlayer();
    const {addNotification} = useNotifications();
    const cacheRef = useRef(new Map()); // store rendered rows
    const musicQueueDivRef = useRef(null);
    const [showQueue, setShowQueue] = useState(false);
    const [isFav, setFav] = useState(currentTrackData?.isFav || false);
    const mobileViewDivRef = useRef(null);
    const swipeInitialHeight = useRef(0);
    const swipeDelta = useRef(0);
    const shiftbackTimer = useRef(null);
    const animationRef = useRef(null);
    const lastTime = useRef(0);
    const divColor1 = useRef(null);
    const divColor2 = useRef(null);
    const divColor3 = useRef(null);
    const shown = useRef(false);
    useEffect(() =>{
        if(!currentTrackData) return;
        setFav(currentTrackData.isFav)
    }, [currentTrackData]);
    const toggleFavorite = async () => {
        // e.stopPropagation();
        if(!currentTrackData) return;
        toggleTrackFavorite(currentTrackData.id, !isFav, setFav);
    }

    const animate = (now) => {
        if(now - lastTime.current < (1000 / 30)){
            animationRef.current = requestAnimationFrame(animate);
            return;
        }

        lastTime.current = now;

        const FFTdata = getFFTAtCurrentTime();
        let FFTdataView = FFTdata.subarray(Math.floor(FFTdata.length * 0.3), Math.floor(FFTdata.length * 0.6));
        const barSummation = Math.max(1,FFTdataView.length / BAR_NUMBER);
        const display = new Array(BAR_NUMBER).fill(0);
        for (let i = 0; i < FFTdataView.length; i++) {
            // todo Math.floor leaves some artefect for bar > fftsise/2 
            display[Math.floor(i/barSummation)] += Number(FFTdata[i])/10;
        }
        divColor1.current.style.setProperty("--strength-1", `${display[1]}%`);
        divColor1.current.style.setProperty("--strength-2", `${display[2]}%`);
        divColor2.current.style.setProperty("--strength-1", `${display[3]}%`);
        divColor2.current.style.setProperty("--strength-2", `${display[4]}%`);
        divColor3.current.style.setProperty("--strength-1", `${display[0]}%`);
        animationRef.current = requestAnimationFrame(animate);
    }
    const closeMobileView = () =>{
        mobileViewDivRef.current.setAttribute("data-shift-back","true");
        mobileViewDivRef.current.style.translate = `0px ${window.screen.height * 0.8}px`;
        mobileViewDivRef.current.setAttribute("data-fade-out","true");
        // Auto goes back to original position
        console.log("clearing from close")
        if(shiftbackTimer.current) clearTimeout(shiftbackTimer.current);
        shiftbackTimer.current = setTimeout(()=>{
            setTrackMobileView(false);
            mobileViewDivRef.current.setAttribute("data-fade-out","true");
            mobileViewDivRef.current.setAttribute("data-shift-back","false");
            shiftbackTimer.current = null;
        },200);
    }
    /**
     * @param {React.TouchEvent} e 
     */
    const handleTouchStart = (e) => {
        swipeInitialHeight.current = e.touches[0].clientY;
        swipeDelta.current = 0;
        if(shiftbackTimer.current) {
            console.log("clearing from touch start")
            clearTimeout(shiftbackTimer.current);
            shiftbackTimer.current = null;
        }
        mobileViewDivRef.current.setAttribute("data-shift-back","false");
    }
    /**
     * @param {React.TouchEvent} e 
     */
    const handleTouchMove = (e) => {
        if(!(swipeInitialHeight.current && mobileViewDivRef.current)) return;
        e.preventDefault(); // <-- stops Safari reload
        if(swipeDelta.current < - 40) return;
        swipeDelta.current = e.touches[0].clientY - swipeInitialHeight.current;
        // addNotification(` SWIPE ${swipeDelta.current}`);
        mobileViewDivRef.current.style.translate = `0px ${swipeDelta.current}px`

    }
        /**
     * @param {React.TouchEvent} e 
     */
    const handleTouchEnd = (e) => {
        const swipped = swipeDelta.current || 0;
        if(swipped < 90){
            mobileViewDivRef.current.setAttribute("data-shift-back","true");
            mobileViewDivRef.current.style.translate = `0px 0px`;
            // Auto goes back to original position
            console.log("clearing from touch end")
            // if(shiftbackTimer.current) clearTimeout(shiftbackTimer.current);
            shiftbackTimer.current = setTimeout(()=>{
                mobileViewDivRef.current.setAttribute("data-shift-back","false");
                shiftbackTimer.current = null;
            }, 300)

        } else closeMobileView();

    }
    const stopMovePropagation = (e) =>{
        e.stopPropagation();
        e.preventDefault();
    }

    useEffect(() => {
		if(!fftConfigRef.current){
			cancelAnimationFrame(animationRef.current);
			console.log("No FFT data to display, releasing anim frame.");
			return;
		} 
		animationRef.current = requestAnimationFrame(animate);
		console.log("FFT found, requested animation frame.");
	},[fftConfigRef.current]);

	useEffect(() => {

		const mq = window.matchMedia("(min-width: 714px)");

		const update = (e) => {
		  shown.current = e.matches; // hidden when true
		  animationRef.current = requestAnimationFrame(animate);	  
		  console.log("Canvas hidden?", shown.current);
		};
	  
		// Initial check
		update(mq);
	  
		// Subscribe
		mq.addEventListener("change", update);
		return () => {
			mq.removeEventListener("change", update);
		}// cleanup on unmount
	}, []);

    return <div id="track-mobile-view"
        ref={mobileViewDivRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}>
        
        <div id="track-mobile-view-content" data-minimize={showQueue}>
            <div className='grad' id='grad1' ref={divColor1}/>
            <div className='grad' id='grad2' ref={divColor2}/>
            <div className='grad' id='grad3' ref={divColor3}/>
            <div id="floating-audio-state" data-minimize={showQueue}>
                <div id="track-mobile-down" onTouchEnd={closeMobileView}><div/></div>
                {(currentTrackData?.type == "radio") ? 
                ((currentTrackData.coverUrl == "") ? 
                    <CML_logo className="trackImage" data-playing={isPlaying}/> :
                    <img src={currentTrackData.coverUrl} data-playing={isPlaying} className="trackImage" />
                ) :
                (trackCoverUrl.split('/').pop() === 'null') ?
                    <CML_logo  className="trackImage" data-playing={isPlaying}/>:
                    <img src={trackCoverUrl} className="trackImage" data-playing={isPlaying}/>
                }
                {currentTrackData ? 
                <SongTitleArtist title={currentTrackData.title} 
                artist={currentTrackData.artist} artistId={currentTrackData.artistId}
                radio={currentTrackData.type === "radio"}
                isMinimal={true} fn={closeMobileView}/> : null}

        </div>
        {showQueue ? 
            playQueue.length > 0 ?  
            <div id="music-queue" ref={musicQueueDivRef} onTouchMove={stopMovePropagation}>
                <List
                height={musicQueueDivRef.current?.offsetHeight || height}
                itemCount={playQueue.length}
                itemSize={itemHeight}
                width={'100%'}
                itemData={{ playQueue, cacheRef, jumpToQueueTrack, queuePointer }}
   
                >
                    {MusicQueueEntry}
                </List></div>:                                     
                <p id="no-items-in-queue">No items in the queue</p>
        : null}
       
        <div id="fixed-audio-state">
        {currentTrackData ? 
            <SongTitleArtist title={currentTrackData.title} 
                artist={currentTrackData.artist} artistId={currentTrackData.artistId}
                radio={currentTrackData.type === "radio"}
                isMinimal={false} fn={closeMobileView}/> : null}
            <SongProgress/>
            <AudioControls context={{mobile : true, maximize : true}}/>
            <div className="track-list-header">
            {playQueue.length > 0 ?
            <ButtonWithCallback text={''} 
                    icon={isFav ? <IconStarFilled /> : <IconStar/>}
                    onClick={toggleFavorite}/>  
            : <ButtonWithCallback text={''}  icon={<IconArrowsShuffle2/>}
                onClick={playLibraryShuffle}/>  
            }
            <ButtonWithCallback text={''} 
                    icon={<IconListDetails/>} 
                    onClick={async ()=>{
                        // e.stopPropagation();
                        setShowQueue(!showQueue)
                        }}/>
                
            </div>
        </div>
        </div>
    </div>
}

export default TrackMobileView;