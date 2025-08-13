import { useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "../GlobalAudioProvider";
import './FullScreenSong.css';
import { IconArrowBackUp } from "@tabler/icons-react";
import ColorThief from "../../node_modules/color-thief/dist/color-thief.mjs"
import _ from "lodash";
const FullScreenSong = () => {
    const {fullScreenImage, requestNewFullScreenImage, playingTrack, toggleFullScreenView, colorOverride} = useAudioPlayer();
    const imgRef = useRef(null);
    const imgRefBack = useRef(null);
    const inactivityTime = useRef(0);
    const maxInactivity = 3;
    const inactivityTimer = useRef(0);
    const [userInactive, setUserInactive] = useState(false);
   

    useEffect(() => {
        if(!playingTrack || !(imgRef.current && imgRefBack.current)) return;

        if(fullScreenImage?.track !== playingTrack){
            requestNewFullScreenImage().then((data) => {
                imgRef.current.src = URL.createObjectURL(data.blob);
                imgRefBack.current.src = URL.createObjectURL(data.blob);
                imgRef.current.addEventListener('load', recomputeColors);
            });
        } else {
            imgRef.current.src = URL.createObjectURL(fullScreenImage.blob);
            imgRefBack.current.src = URL.createObjectURL(fullScreenImage.blob);
        }
        // let palette
        // if (imgRef.current.complete) {
        //     palette = colorThief.getPalette(imgRef.current,2);
        //     console.log(palette);
        // }
    },[playingTrack]);

    const recomputeColors = () => {
        let colorThief = new ColorThief();
        const palette = _.shuffle(colorThief.getPalette(imgRef.current,4));
        console.log(palette);
        colorOverride.current = palette;
    }

    useEffect(()=>{
        const resetInactivityTimer = () => {
            inactivityTime.current = 0;
            if(userInactive) setUserInactive(false);
        }
        
        const checkInactivity = () => {
            inactivityTime.current++;
            if (inactivityTime.current >= maxInactivity) {
+                setUserInactive(true);
            }else{
                setUserInactive(false);
            }
        }
    
        const activity = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
        // Listen for user activity
        activity.forEach(evt => {
            window.addEventListener(evt, resetInactivityTimer);}
        );
        // Check inactivity every second
        inactivityTimer.current = setInterval(checkInactivity, 1000);
        if(imgRef.current?.complete && imgRef.current?.src){
            recomputeColors();
        }
        return () => {
            activity.forEach(evt => {
                window.removeEventListener(evt,resetInactivityTimer);});
            clearInterval(inactivityTimer.current);
            colorOverride.current = [];
        } 
    },[userInactive]);

    return (
    <>
        <button style={{zIndex:2, position: "relative"}}className="roundButton full-screen-back" data-inactive={userInactive} onClick={toggleFullScreenView}>
            <IconArrowBackUp />
        </button>
        {playingTrack && <>
            <img className="full-screen-image-back" ref={imgRefBack} crossOrigin={"anonymous"} alt="No tracks palying"/>
            <div className="full-screen">
                <img className="full-screen-image" ref={imgRef} crossOrigin={"anonymous"} alt="No tracks palying"/>
                
            </div>
            </>
        }
    </>
    )
}

export default FullScreenSong;