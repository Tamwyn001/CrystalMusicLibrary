import { useAudioPlayer } from '../GlobalAudioProvider.jsx';
import './SongProgress.css';
import { parseAudioDuration } from "../../lib.js";
import ProgressBar from './ProgressBar.jsx';


const SongProgress = ({}) => {
    const { currentTrackData, currentTime, jumpToPercent } = useAudioPlayer();
    if (!currentTrackData || Object.keys(currentTrackData).length === 0) {
        return null; // or some fallback UI
    }
    return(
    <div className="songProgress">
        <div>
            <span id="time-elapsed">{parseAudioDuration(currentTime).readable}</span>
            <ProgressBar percent={currentTime/ currentTrackData.rawDuration *100} 
            showPercent={false} fillColor = "var(--violet-web-color)" style={{height : '10px'}}
            onClickPercentage={jumpToPercent}/>
            <span id="time-remaining">{currentTrackData.duration.readable}</span>
        </div>
    </div>
    )
};

export default SongProgress;