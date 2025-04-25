import { useEffect, useState } from "react";
import { useAudioPlayer } from "../GlobalAudioProvider";
import CML_logo from "./CML_logo";
import apiBase from "../../APIbase";

const MusicQueueEntry = ({index, trackId}) => {
    const [trackName, setTrackName] = useState("");
    const [coverURL, setCoverURL] = useState("");
    const { jumpToQueueTrack, queuePointer } = useAudioPlayer(); 

    useEffect(() => {
        fetch(`${apiBase}/read-write/shortTrackInfos/${trackId}`, {
            method: "GET",
            credentials: "include"
        })
        .then(res => {
            if (!res.ok) {throw new Error("Network response was not ok");}
            return res.json();
        })
        .then(data => {
            setTrackName(data.title);
            if(data.cover){setCoverURL(data.cover);}
        })
    }, []);
    return (
        <div className="music-queue-entry" is-passed={`${index < queuePointer}`} is-selected={`${index === queuePointer}`} onClick={() => jumpToQueueTrack(index)}>
            {(coverURL)? <img src={`${apiBase}/covers/${coverURL}`} alt={`${trackName} cover`} className="track-image-small" />
             : <CML_logo className="track-image-small" />}

            <p className="track-title">{index} {trackName}</p>
        </div>
    )
}
export default MusicQueueEntry;