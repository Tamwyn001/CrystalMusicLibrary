import { IconFolderPin, IconHeart, IconHeartBroken, IconLabel, IconMusicX, IconRowInsertBottom, IconRowInsertTop } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "../GlobalAudioProvider";
import { useLocation } from "react-router-dom";


function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height
    };
  }

const TrackActions = ({trackY, track, isFav}) => {
    const [ windowDim, setWindowDims ] = useState(getWindowDimensions());
    const {onClicTrackActionEntry, trackActionTypes} = useAudioPlayer();
    const [isPlaylistView, setIsPlaylistView] = useState(false);
    const wrapperRef = useRef(null);
    const [top, setTop] = useState(null);
    const location = useLocation();
    const [ isMobile, setIsMobile ] = useState(() => window.innerWidth < 714);

    useEffect(() => {
        const handleClickedOutside = (e) =>{            
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                onClicTrackActionEntry(trackActionTypes.NONE);
            }}
    
        document.addEventListener("mousedown", handleClickedOutside);
        document.addEventListener("touchstart", handleClickedOutside);
        


        setIsPlaylistView(location.pathname.includes("playlist"));
        return () => {
            document.removeEventListener("mousedown", handleClickedOutside);
            document.removeEventListener("touchstart", handleClickedOutside);
        }
    },[]);

    useEffect(()=>{
        const height = isPlaylistView ? 250 : 180
        setTop( Math.min(trackY,  windowDim.height - height));
    },[isPlaylistView])



    return(top && <div className="track-actions-div"  ref={wrapperRef} style={{height : "fit-content", top:top}}>
        <div className="track-action-entry" onClick={() => {onClicTrackActionEntry(trackActionTypes.TOP_QUEUE, track)}}>
            <span>Front queue</span> <IconRowInsertTop/>
        </div>
        <div className="track-action-entry" onClick={() => {onClicTrackActionEntry(trackActionTypes.END_QUEUE, track)}}>
            <span>Back queue</span> <IconRowInsertBottom/>
        </div>

        {(isPlaylistView) &&
            <div className="track-action-entry" onClick={() => {onClicTrackActionEntry(trackActionTypes.GOTO_ALBUM, track)}}>
                <span>View album</span> <IconFolderPin/>
            </div>
        }
        {(isPlaylistView && !isFav) &&
            <div className="track-action-entry" onClick={() => {onClicTrackActionEntry(trackActionTypes.REMOVE_FROM_PLAYLIST, track)}}>
                <span>Delete from playlist</span> <IconMusicX/>
            </div>
        }
        <div className="track-action-entry" onClick={() => {onClicTrackActionEntry(trackActionTypes.TAGS, track)}}>
            <span>Edit tags</span> <IconLabel/>
        </div>
        {
           ( isMobile && track.is_favorite) ?
            <div className="track-action-entry" onClick={() => {onClicTrackActionEntry(trackActionTypes.REMOVE_FROM_FAVORITES, track)}}>
                <span>Remove from favorite</span> <IconHeartBroken/>
            </div> : null
        }
        {
          (  isMobile && !track.is_favorite) ? 
            <div className="track-action-entry" onClick={() => {onClicTrackActionEntry(trackActionTypes.ADD_TO_FAVORITES, track)}}>
                <span>Add to favorites</span> <IconHeart/>
            </div> : null
        }
                    
    </div>)
}

export default TrackActions;