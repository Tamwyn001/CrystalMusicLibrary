import { useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "../GlobalAudioProvider";
import './FullScreenSong.css';
import { IconArrowBackUp, IconColorSwatch, IconPlayerPause, IconPlayerTrackPrev } from "@tabler/icons-react";
import ColorThief from "../../node_modules/color-thief/dist/color-thief.mjs"
import _ from "lodash";
import AudioControls from "../components/AudioControls";
import { lerp } from "../../lib";
const FullScreenSong = () => {
    const {fullScreenImage, requestNewFullScreenImage, playingTrack, toggleFullScreenView, colorOverride} = useAudioPlayer();
    const imgRef = useRef(null);
    const imgRefBack = useRef(null);
    const imgRefB = useRef(null);
    const imgRefBackB = useRef(null);
    const globalImgRef = useRef(null);
    const currentImg = useRef(false);
    const inactivityTime = useRef(0);
    const maxInactivity = 3;
    const inactivityTimer = useRef(0);
    const [userInactive, setUserInactive] = useState(false);
    const paletteRef = useRef([]);
    const timeoutRef = useRef(0);
    const colorTimeoutRef = useRef(0);

    const assignBlobToNewImage = (blob) => {
        if (currentImg.current){
            imgRef.current.src = URL.createObjectURL(blob);
            imgRefBack.current.src = URL.createObjectURL(blob);
            globalImgRef.current = imgRef.current;
        }else{
            imgRefB.current.src = URL.createObjectURL(blob);
            imgRefBackB.current.src = URL.createObjectURL(blob);
            globalImgRef.current = imgRefB.current;
        }
        globalImgRef.current.addEventListener('load', requestRecomputAndFade);
    }
    useEffect(() => {
        if(!playingTrack || !(imgRef.current && imgRefBack.current)) return;

        if(fullScreenImage?.track !== playingTrack){
            currentImg.current = !currentImg.current;
            requestNewFullScreenImage().then((data) => {
                assignBlobToNewImage(data.blob);
            });
        } else {
            assignBlobToNewImage(fullScreenImage.blob)
        }
        

    },[playingTrack]);

    const toggleVisibilityFromImageCouple = (isA, hidden) => {
        if(isA){
            imgRef.current.setAttribute("data-hidden", hidden);
            imgRefBack.current.setAttribute("data-hidden", hidden);
        }else{
            imgRefB.current.setAttribute("data-hidden", hidden);
            imgRefBackB.current.setAttribute("data-hidden", hidden);
        }
    }
    const requestRecomputAndFade = () => {
        toggleVisibilityFromImageCouple(currentImg.current, false);
        toggleVisibilityFromImageCouple(!currentImg.current, true);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(()=>{
            if(currentImg.current){
                if(imgRefB.current){
                    imgRefB.current.src = null;
                    imgRefBackB.current.src = null;
                }
            }else{
                if(imgRef.current){
                imgRef.current.src = null;
                imgRefBack.current.src = null; 
                }
            }
        },1100);
        recomputeColors();
    }
    const recomputeColors = () => {
        globalImgRef.current.removeEventListener('load', requestRecomputAndFade);
        let colorThief = new ColorThief();
        paletteRef.current = colorThief.getPalette(globalImgRef.current, 10);
        suffleColors();
    }

    const suffleColors = () => {
        const choosed =  _.shuffle(paletteRef.current);
        clearTimeout(colorTimeoutRef.current);
        const colors = choosed.slice(0,2);
        if(colorOverride.current.length === 0) {
            colorOverride.current = colors;
        } else {
            lerpColors(colors , 0);
        }
    }

    const lerpColors = (colors, frame) => {
        colorOverride.current = colorOverride.current.map(
            (color,i) => color.map((col, j) => {
                return parseInt(lerp(col, colors[i][j], 0.1))}
            ));
        if(frame > 150) return;
        colorTimeoutRef.current = setTimeout(()=>{
            lerpColors(colors, frame + 1);
        }, 1000/60);
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
        if(globalImgRef.current?.complete && globalImgRef.current?.src){
            recomputeColors();
        }
        
        return () => {
            activity.forEach(evt => {
                window.removeEventListener(evt,resetInactivityTimer);});
            clearInterval(inactivityTimer.current);
            clearTimeout(colorTimeoutRef.current);
            colorOverride.current = [];
        } 
    },[]);

    return (
    <>
        <div className="full-screen-header">
            <button className="roundButton full-screen-back" data-inactive={userInactive} onClick={toggleFullScreenView}>
                <IconArrowBackUp />
            </button>
            <button className="roundButton full-screen-back" data-inactive={userInactive} onClick={suffleColors}>
                <IconColorSwatch />
            </button>
        </div>
        <div data-inactive={userInactive} className="full-screen-audio-ctrl">
            <AudioControls context={{mobile:false}}/>
        </div>
        {playingTrack && <>
            <img className="full-screen-image-back full-screen-fadable" ref={imgRefBack} crossOrigin={"anonymous"} alt="No tracks palying"/>
            <div className="full-screen">
                <img className="full-screen-image full-screen-fadable" ref={imgRef} crossOrigin={"anonymous"} alt="No tracks palying"/>
                
            </div>
            <img className="full-screen-image-back full-screen-fadable" ref={imgRefBackB} crossOrigin={"anonymous"} alt="No tracks palying"/>
            <div className="full-screen">
                <img className="full-screen-image full-screen-fadable" ref={imgRefB} crossOrigin={"anonymous"} alt="No tracks palying"/>
                
            </div>
            </>
        }
    </>
    )
}

export default FullScreenSong;