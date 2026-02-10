import { useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "../GlobalAudioProvider.jsx";
import './FullScreenSong.css';
import { IconArrowBackUp, IconColorSwatch } from "@tabler/icons-react";
import _ from "lodash";
import AudioControls from "../components/AudioControls.jsx";
import { contrastRatio, lerp } from "../../lib.js";
import apiBase from "../../APIbase.js";
import TrackLyrics from "./TrackLyrics.jsx";
const FullScreenSong = () => {
    const {fullScreenImage,currentTrackData, 
        requestNewFullScreenImage, playingTrack,
        toggleFullScreenView, colorOverride, recomputeColors,
        songPalette } = useAudioPlayer();
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
    const clicedNumRef = useRef(0);
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
        if(!(imgRef.current && imgRefBack.current)) return;
        if(currentTrackData?.type == "radio"){
            if(currentTrackData.coverUrl){
                const url = `${apiBase}/radio/favicon-proxy?url=${encodeURIComponent(currentTrackData.coverUrl)}`
                if (currentImg.current){
                    imgRef.current.src = url;
                    imgRefBack.current.src =url;
                    globalImgRef.current = imgRef.current;
                }else{
                    imgRefB.current.src = url;
                    imgRefBackB.current.src = url;
                    globalImgRef.current = imgRefB.current;
                }
            }
            return;
        } 
        if(!playingTrack) return;

        if(fullScreenImage?.track !== playingTrack){
            currentImg.current = !currentImg.current;
            requestNewFullScreenImage().then((data) => {
                assignBlobToNewImage(data.blob);
            });
        } else {
            assignBlobToNewImage(fullScreenImage.blob)
        }
        

    },[currentTrackData,playingTrack]);

    const toggleVisibilityFromImageCouple = (isA, hidden) => {
        if(isA){
            imgRef.current.setAttribute("data-hidden", hidden);
            imgRefBack.current.setAttribute("data-hidden", hidden);
        }else{
            imgRefB.current.setAttribute("data-hidden", hidden);
            imgRefBackB.current.setAttribute("data-hidden", hidden);
        }
    }

    const onColorComputed = () => {
        imgRef.current.removeEventListener('load', requestRecomputAndFade);
        suffleColors()
    };
    const requestRecomputAndFade = () => {
        if(!globalImgRef.current?.src) return;
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
        
        recomputeColors(globalImgRef, onColorComputed);
       

    }
    

    const suffleColors = () => {
        const pairsNum = songPalette.current.pairs.length || 0;
        if(pairsNum === 0) return;
       
        const pickedColors = songPalette.current.pairs[pairsNum - 1 - clicedNumRef.current % pairsNum];
        const colors =  [pickedColors.c1, pickedColors.c2];
        clicedNumRef.current += 1;
        clearTimeout(colorTimeoutRef.current);
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
            setUserInactive(false);
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
            recomputeColors(imgRef, onColorComputed);
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
    <div id="full-screen-page">
        <div className="full-screen-header">
            <button className="roundButton full-screen-back go-back" data-inactive={userInactive} onClick={toggleFullScreenView}>
                <IconArrowBackUp />
            </button>
            <button className="roundButton full-screen-back" data-inactive={userInactive} onClick={suffleColors}>
                <IconColorSwatch />
            </button>
        </div>
        <TrackLyrics/>
        <div data-inactive={userInactive} className="full-screen-audio-ctrl">
            <AudioControls context={""}/>
        </div>
        {(playingTrack || currentTrackData?.type == "radio") && <>
            <img className="full-screen-image-back full-screen-fadable" ref={imgRefBack} crossOrigin={"anonymous"} data-inactive={userInactive} alt="No tracks palying"/>
            <div className="full-screen">
                <img className="full-screen-image full-screen-fadable" ref={imgRef} crossOrigin={"anonymous"} data-inactive={userInactive} alt="No tracks palying"/>
                
            </div>
            <img className="full-screen-image-back full-screen-fadable" ref={imgRefBackB} crossOrigin={"anonymous"} data-inactive={userInactive} alt="No tracks palying"/>
            <div className="full-screen">
                <img className="full-screen-image full-screen-fadable" ref={imgRefB} crossOrigin={"anonymous"} data-inactive={userInactive} alt="No tracks palying"/>
                
            </div>
            </>
        }
    </div>
    )
}

export default FullScreenSong;