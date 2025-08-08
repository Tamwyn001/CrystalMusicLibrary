import { Outlet } from "react-router-dom";
import { useAudioPlayer } from "../GlobalAudioProvider";
import FFTVisualizer from "./FFTVisualizer";

const RouteWithFFT = () =>{
    const {playingTrack} = useAudioPlayer();
    
    return(
    <div className="content-with-fft">
        <Outlet /> {/* Route content will render here */}
        {playingTrack ? <FFTVisualizer/> : null}
    </div>
    );
}

export default RouteWithFFT;