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
    const [playQueue, setPlayQueue] = useState([]); // Store play queue here
    const [trackCoverUrl, setTrackCoverUrl] = useState(''); // Store track cover URL here
    const resolveTrackURL = (name) => `${apiBase}/read-write/music/${name}`; // Adjust the path as needed
    let context = {isPlaylist : false, containerId: '', trackName: ''};
    const toggleTrackPaused = () => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
        console.log('toggleTrackPaused', isPlaying);
    }
    const getNextSongsFromAlbum = () => {
        console.log(`${apiBase}/read-write/nextSongs/${context.isPlaylist}/${context.containerId}/${context.trackName}`);
        fetch(`${apiBase}/read-write/nextSongs/${context.isPlaylist}/${context.containerId}/${context.trackName}`, {
            method: 'GET'
        }).then(response => response.json())
        .then(data => setPlayQueue(data));
    }
    const playNextSong = () => {
        if (playQueue.length === 0) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false); // Pause the audio
            setCurrentTrackData(null)
            return; // No tracks to play
        }
        const nextTrack = playQueue[0]; // Get the next track from the queue
        setPlayQueue(playQueue.filter((track) => {return track !== nextTrack})); // Update the play queue
        console.log('playNextSong', nextTrack);
        resolvetrack(nextTrack);
    }

    const playTrack = (trackName, containerId, isPlaylist) => {

       
        context.trackName = trackName.split('.')[0];
        context.containerId = containerId;
        context.isPlaylist = isPlaylist;
        resolvetrack(trackName);
        getNextSongsFromAlbum();
    }
    useEffect(() => {
        if (playQueue.length === 0) return; // No tracks to play
        console.log('PlayQueue', playQueue);
    }, [playQueue]);

    // audio.addEventListener("timeupdate", timeListener);
    const resolvetrack = (trackName) => {

        if (audioRef.current.src !== resolveTrackURL(trackName)) {
            audioRef.current.src = resolveTrackURL(trackName); // Set the new track URL
        }
        audioRef.current.play()
        setPlayingTrack(trackName);
        setIsPlaying(true);
        fetch(`${apiBase}/read-write/trackInfos/${trackName.split('.')[0]}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            data.duration = parseAudioDuration(data.rawDuration);
            setCurrentTrackData(data);
        })
        fetchTrackCover(trackName);

    }
    const fetchTrackCover = (trackName) =>{
        fetch(`${apiBase}/read-write/trackCover/${trackName.split('.')[0]}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {setTrackCoverUrl(`${apiBase}/covers/${data}`);})
    }
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
            currentTime,
            isPlaying,
            toggleTrackPaused,
            playNextSong,
            trackCoverUrl
            }}>
            {children}
        </AudioPlayerContext.Provider>
    );
}

//this is to import for the child components to call audio control functions
export const useAudioPlayer = () => useContext(AudioPlayerContext);