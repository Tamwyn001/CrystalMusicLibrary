import { IconAdjustmentsPlus, IconPlayerPause, IconPlayerPauseFilled, IconPlayerPlay, IconPlayerPlayFilled, IconPlayerTrackNext, IconPlayerTrackNextFilled, IconPlayerTrackPrev, IconPlayerTrackPrevFilled } from "@tabler/icons-react"
import SvgHoverToggle from "./SvgHoverToggle"
import { useAudioPlayer } from "../GlobalAudioProvider";

const AudioControls = ({context}) => {
    const { isPlaying, toggleTrackPaused,playNextSong,playPreviousSong,jumpTrackSeconds } = useAudioPlayer();
    return(
        <div className="audio-controls" context={(context.mobile) ? 'mobile' : 'desktop'}>
            {(!context.mobile) ? <SvgHoverToggle iconHovered={IconPlayerTrackPrevFilled} iconDefault={IconPlayerTrackPrev} onClick={playPreviousSong}/> : null}
            <SvgHoverToggle iconHovered={ (isPlaying) ? IconPlayerPauseFilled : IconPlayerPlayFilled} 
                            iconDefault={(isPlaying) ? IconPlayerPause : IconPlayerPlay} 
                            onClick={toggleTrackPaused}/>
            <SvgHoverToggle iconHovered={IconPlayerTrackNextFilled} iconDefault={IconPlayerTrackNext} onClick={playNextSong}/>
        </div>
    )
}

export default AudioControls;