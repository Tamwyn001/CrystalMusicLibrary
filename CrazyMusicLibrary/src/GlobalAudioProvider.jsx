import { createContext, useContext, useEffect, useRef, useState } from "react";
import apiBase from "../APIbase";
import { parseAudioDuration } from "../lib.js";
const AudioPlayerContext = createContext();

//this is only for the top level component
export const AudioPlayerProvider = ({ children }) => {
    // all function logic
    const [playingTrack, setPlayingTrack] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackData, setCurrentTrackData] = useState({}); // Store track data here
    const [currentTime, setCurrentTime] = useState(0); // Store current time here
    const audioRef = useRef(new Audio());
    const resolveTrackURL = (name) => `${apiBase}/read-write/music/${name}`; // Adjust the path as needed


    const playTrack = (trackName) => {
        setPlayingTrack(trackName);
        setIsPlaying(true);
        if (audioRef.current.src !== resolveTrackURL(trackName)) {
            audioRef.current.src = resolveTrackURL(trackName); // Set the new track URL
        }
        audioRef.current.play()
        fetch(`${apiBase}/read-write/trackInfos/${trackName.split('.')[0]}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            data.duration = parseAudioDuration(data.rawDuration);
            setCurrentTrackData(data);
        })
    }
    // audio.addEventListener("timeupdate", timeListener);

    useEffect(() => {
        const audio = audioRef.current;
        const updateTime = () => setCurrentTime(audio.currentTime);
        audio.addEventListener("timeupdate", updateTime);
    
        return () => {
            audio.removeEventListener("timeupdate", updateTime);
        };
    }, []);

    return (
        <AudioPlayerContext.Provider 
        value={{/* all function logic */
            playTrack,
            currentTrackData,
            currentTime
            }}>
            {children}
        </AudioPlayerContext.Provider>
    );
}

//this is to import for the child components to call audio control functions
export const useAudioPlayer = () => useContext(AudioPlayerContext);