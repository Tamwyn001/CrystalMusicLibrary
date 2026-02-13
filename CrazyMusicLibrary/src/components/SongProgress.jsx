import { useAudioPlayer } from '../GlobalAudioProvider.jsx';
import './SongProgress.css';
import { parseAudioDuration } from "../../lib.js";
import ProgressBar from './ProgressBar.jsx';
import { useEffect, useState } from 'react';


const SongProgress = ({}) => {
    const { currentTrackData, currentTimeRef, jumpToPercent } = useAudioPlayer();
    const [displayTime, setDisplayTime] = useState(0);
    if (!currentTrackData || Object.keys(currentTrackData).length === 0) {
        return null; // or some fallback UI
    }
    useEffect(() => {
    const interval = setInterval(() => {
      setDisplayTime(currentTimeRef.current);
    }, 100);

    return () => clearInterval(interval);
  }, []);
    return(
    <div className="songProgress">
        <div>
            <span id="time-elapsed">{parseAudioDuration(displayTime).readable}</span>
            <ProgressBar percent={displayTime/ currentTrackData.rawDuration *100} 
            showPercent={false} fillColor = "var(--violet-web-color)" style={{height : '10px'}}
            onClickPercentage={jumpToPercent}/>
            <span id="time-remaining">{currentTrackData.duration.readable}</span>
        </div>
    </div>
    )
};

export default SongProgress;