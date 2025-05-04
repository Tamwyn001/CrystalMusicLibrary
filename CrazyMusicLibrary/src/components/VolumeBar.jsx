import { useEffect, useRef } from "react";
import { useAudioPlayer } from "../GlobalAudioProvider";
import ProgressBar from "./ProgressBar"

const VolumeBar = ({ onClosed, hideComponent  }) => { 
    const{ setVolume, volume } = useAudioPlayer();
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickedOutside = (e) =>{            
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                if(e.target.closest('svg')?.id === 'volume-button' ){return;}
                hideComponent();
            }}

        document.addEventListener("mousedown", handleClickedOutside);
        document.addEventListener("touchstart", handleClickedOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickedOutside);
            document.removeEventListener("touchstart", handleClickedOutside);
        }
    },[]);

    return(
        <div ref={wrapperRef} className="volume-bar">
            <ProgressBar onClickPercentage={(percent) => {console.log("change volume"); setVolume(percent / 100);}} style={{height : '10px'}} fillColor="rgb(118, 173, 206)" percent={volume * 100}/>
        </div>
    )
};

export default VolumeBar;
