import { useAudioPlayer } from '../GlobalAudioProvider.jsx';
import './SongProgress.css';
import { parseAudioDuration } from "../../lib.js";
import ProgressBar from './ProgressBar.jsx';
const SongProgress = () => {
    const { currentTrackData, currentTime, jumpToPercent } = useAudioPlayer();
    if (!currentTrackData || Object.keys(currentTrackData).length === 0) {
        return null; // or some fallback UI
    }

    const AsTrack = () => {
        return (<div>
        <span>{parseAudioDuration(currentTime).readable}</span>
        <ProgressBar percent={currentTime/ currentTrackData.rawDuration *100} 
        showPercent={false} fillColor = "var(--violet-web-color)" style={{height : '10px'}}
        onClickPercentage={jumpToPercent}/>
        <span>{currentTrackData.duration.readable}</span></div>)
    } 
    const AsRadio = () => {
        return null;
        // In the future maybe add some design..
        // return (<div>
        // <span>{parseAudioDuration(currentTime).readable}</span>
        // <ProgressBar percent={currentTime/ currentTrackData.rawDuration *100} 
        // showPercent={false} fillColor = "var(--violet-web-color)" style={{height : '10px'}}
        // onClickPercentage={jumpToPercent}/>
        // <span>{currentTrackData.duration.readable}</span></div>)
    } 
    return(
        <div className="songProgress">
        {currentTrackData?.type == 'radio' ? <AsRadio/>:
              <AsTrack/>}
        </div>
    )
}

export default SongProgress;