import { IconAdjustmentsPlus, IconPlayerPause, IconPlayerPauseFilled, IconPlayerPlay, IconPlayerPlayFilled, IconPlayerTrackNext, IconPlayerTrackNextFilled, IconPlayerTrackPrev, IconPlayerTrackPrevFilled } from "@tabler/icons-react"
import SvgHoverToggle from "./SvgHoverToggle"
import { useAudioPlayer } from "../GlobalAudioProvider";

const AudioControls = ({context}) => {
    const { isPlaying, toggleTrackPaused,playNextSong,playPreviousSong } = useAudioPlayer();
    const handleToggleTrackPaused = (e) =>{
        e.stopPropagation();
        toggleTrackPaused();
    }
    const handlePlayNextSong = (e) =>{
        e.stopPropagation();
        playNextSong();
    }
    const handlePreviousNextSong = (e) =>{
        e.stopPropagation();
        playPreviousSong();
    }
    return(
        <div className="audio-controls" data-mobile-context={context.mobile}>
            {(!context.mobile || context.maximize) ? <SvgHoverToggle iconHovered={IconPlayerTrackPrevFilled} 
                iconDefault={IconPlayerTrackPrev} onClick={handlePreviousNextSong}/> : null}
            <SvgHoverToggle iconHovered={ (isPlaying) ? IconPlayerPauseFilled : IconPlayerPlayFilled} 
                            iconDefault={(isPlaying) ? IconPlayerPause : IconPlayerPlay} 
                            onClick={handleToggleTrackPaused}/>
            <SvgHoverToggle iconHovered={IconPlayerTrackNextFilled} iconDefault={IconPlayerTrackNext}
             onClick={handlePlayNextSong}/>
        </div>
    )
}

export default AudioControls;