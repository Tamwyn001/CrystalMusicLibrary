import {  useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "../GlobalAudioProvider";
import CML_logo from "./CML_logo";
import apiBase from "../../APIbase";
import { useInView } from 'react-intersection-observer';
import { useTrackCache } from "./MusicQueue";

const MusicQueueEntry = ({index, trackId,style}) => {
    const { getTrack, setTrack } = useTrackCache();
    const [trackInfo, setTrackInfo] = useState(getTrack(trackId) || null);
    const { jumpToQueueTrack, queuePointer } = useAudioPlayer(); 
    const trackNameRef = useRef("");
    const coverURLRef = useRef(null);
    const { ref, inView } = useInView({
        threshold: 0.1, // 10% of the component is visible
        triggerOnce: true
    });


    useEffect(() => {
        if(inView && !trackInfo){
            fetch(`${apiBase}/read-write/shortTrackInfos/${trackId}`, {
                method: "GET",
                credentials: "include"
            })
            .then(res => {
                if (!res.ok) {throw new Error("Network response was not ok");}
                return res.json();
            })
            .then(data => {
                setTrackInfo(data);
                setTrack(trackId, data); //cache the values
            });
        }
        trackNameRef.current = trackInfo?.title ?? null;
        coverURLRef.current = trackInfo?.cover ?? null;
    }, [ inView, trackId, trackInfo]);
   

    return (
        <div
            className="music-queue-entry"
            style={{...style, overflow: 'hidden'}}
            is-passed={`${index < queuePointer}`}
            is-selected={`${index === queuePointer}`}
            ref={ref}
            onClick={() => jumpToQueueTrack(index)}
        >
            {coverURLRef.current ? (
                <img src={`${apiBase}/covers/${coverURLRef.current}`} alt={"cover"} className="track-image-small" />
            ) : (
                <CML_logo className="track-image-small" />
            )}
            <p className="track-title" style={{whiteSpace : 'nowrap'}}>{index} {trackNameRef.current}</p>
        </div>
    );
}
export default MusicQueueEntry;