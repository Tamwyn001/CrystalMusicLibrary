import { createContext, useContext, useEffect, useRef, useState } from "react";
import apiBase from "../APIbase";
import { parseAudioDuration } from "../lib.js";
import { preconnect } from "react-dom";

import _, { floor } from "lodash";
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
    const [trackCoverUrl, setTrackCoverUrl] = useState('null'); // Store track cover URL here
    const resolveTrackURL = (name) => `${apiBase}/read-write/music/${name}`; // Adjust the path as needed
    let context = {isPlaylist : false, containerId: '', trackName: ''};
    const [queuePointer, setQueuePointer] = useState(-1); // Pointer to the current track in the queue
    const [justAddedNewToQueue, setJustAddedNewToQueue] = useState(false); // Flag to indicate if a new track was added to the queue
    const playQueueRef = useRef(playQueue);
    const queuePointerRef = useRef(queuePointer);

    useEffect(() => {
        playQueueRef.current = playQueue;
        console.log('PlayCueue updated', playQueueRef.current);
    }, [playQueue]);
    
    useEffect(() => {
        queuePointerRef.current = queuePointer;
    }, [queuePointer]);

    const toggleTrackPaused = () => {
        console.log(queuePointer);
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            if (queuePointer === -1 && playQueue.length !== 0 ) {
                setQueuePointer(0);
                return;
            }
            audioRef.current.play();
        }
    }

    const getNextSongsFromAlbum = (index) => {
        console.log(`${apiBase}/read-write/nextSongs/${context.isPlaylist}/${context.containerId}`);
        fetch(`${apiBase}/read-write/nextSongs/${context.isPlaylist}/${context.containerId}`, {
            method: 'GET'
        }).then(response => response.json())
        .then(data => {
            console.log('setting play queue');
            setPlayQueue(data.queue);
            setQueuePointer(index); //we do this here to this when the useEffect fires, both are updated.
        });
    }

    const playTrackNoQueue = (trackPath) => {
        setPlayQueue([trackPath]);
        setQueuePointer(0);
    };


    useEffect(() => {
        if (justAddedNewToQueue) {
            setJustAddedNewToQueue(false); // Reset the flag after processing
            return; // avoid reseting the track to the beggining
        }
        if(queuePointer === -1 || playQueue.length ===0 )return;
        resolvetrack(playQueue[queuePointer])
    },[queuePointer, playQueue]); // Update the queue pointer when the play queue changes

    // useEffect(() => {console.log(queuePointer)}, [queuePointer]); // Log the queue pointer when it changes

    const playPreviousSong = () => {
        if (audioRef.current.currentTime > 5 || queuePointer === 0) { // Check if the current time is greater than 3 seconds or if it's the first song
            audioRef.current.currentTime = 0; // Reset the current time to 0
            return; // Don't play the previous song if the current time is less than 3 seconds
        }
        setQueuePointer(queuePointer - 1); // Move to the previous track in the queue
    }
    const addAlbumToQueue = async (albumID) => {
        setJustAddedNewToQueue(true);
        const res = await fetch(`${apiBase}/read-write/album/${albumID}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok) {
            throw new Error('Network response was not ok'); 
        }
        const data = await res.json();
        // console.log('Adding album to queue', data);
        const tracks = data.tracks.map((track) => track.id); // Extract the track paths from the response
        setPlayQueue((prevQueue) => [...prevQueue, ...tracks]);
    }

    const playSuffle = (containerId, isPlaylist) => {
        context.containerId = containerId;
        context.isPlaylist = isPlaylist;
        fetch(`${apiBase}/read-write/nextSongs/${context.isPlaylist}/${context.containerId}`, { 
            method: 'GET'
        }).then(response => response.json())
        .then(data => {
            console.log('setting play queue', data.queue);
            setPlayQueue(_.shuffle(data.queue));
            setQueuePointer(0); //we do this here to this when the useEffect fires, both are updated.
        });
    }
    const playNextSong = (useRefs = false) => {
        const queue = useRefs ? playQueueRef.current : playQueue;
        const pointer = useRefs ? queuePointerRef.current : queuePointer;
    
        if (queue.length <= pointer + 1) {
            stopMusic();
        }
    
        setQueuePointer(pointer + 1);
    };

    const stopMusic = () => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentTime(0); // Reset the current time state
        audioRef.current.src = ''; // Clear the audio source
        setIsPlaying(false);
        setCurrentTrackData(null);
        setQueuePointer(-1);
        setTrackCoverUrl('null');
        setPlayQueue([]);
        setPlayingTrack('');
        console.log('No more songs in the queue');
        return;
    }

    const jumpToPercent = (percent) => {
        if (percent < 0 || percent > 100) return; // Ensure percent is between 0 and 100
        const newTime = (percent / 100) * audioRef.current.duration; // Calculate new time based on percent
        audioRef.current.currentTime = newTime; // Set the new current time
        setCurrentTime(newTime); // Update the current time state
    }

    const jumpTrackSeconds = (seconds) => {
        if (audioRef.current.currentTime + seconds > audioRef.current.duration) {
            audioRef.current.currentTime = audioRef.current.duration; // Set to the end of the track
        } else if (audioRef.current.currentTime + seconds < 0) {
            audioRef.current.currentTime = 0; // Set to the beginning of the track
        } else {
            audioRef.current.currentTime += seconds; // Jump forward or backward
        }
        setCurrentTime(audioRef.current.currentTime); // Update the current time state
    }

    const playTrack = (trackName, containerId, isPlaylist, index) => {
        context.trackName = trackName.split('.')[0];
        context.containerId = containerId;
        context.isPlaylist = isPlaylist;
        console.log('new index',index)

        getNextSongsFromAlbum(index);
    }
    useEffect(() => {
        if (playQueue.length === 0) return; // No tracks to play
        console.log('PlayQueue', playQueue);
    }, [playQueue]);

    // audio.addEventListener("timeupdate", timeListener);
    const resolvetrack = (trackName) => {
        if (audioRef.current.src !== resolveTrackURL(trackName)) {
            audioRef.current.src = resolveTrackURL(trackName); // Set the new track URL
        }else{
            audioRef.current.currentTime = 0; // Reset the current time if the track is already loaded
            setCurrentTime(0);
            return;
        }
        audioRef.current.play()
        setPlayingTrack(trackName);
        setIsPlaying(true);
        console.log('playing track', trackName);
        fetch(`${apiBase}/read-write/trackInfos/${trackName.split('.')[0]}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            // console.log(data);
            data.duration = parseAudioDuration(data.rawDuration);
            setCurrentTrackData(data);
        })
        fetchTrackCover(trackName);

    }
    const jumpToQueueTrack = (index) => {
        if (index < 0 || index >= playQueue.length) return; // Ensure index is within bounds
        setQueuePointer(index); // Set the queue pointer to the specified index
    }
    const fetchTrackCover = (trackName) =>{
        fetch(`${apiBase}/read-write/trackCover/${trackName.split('.')[0]}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {setTrackCoverUrl(`${apiBase}/covers/${data}`);})
    }
    const deleteQueue = () => {
        stopMusic();
        setPlayQueue([]);
        setQueuePointer(-1);
    }
    useEffect(() => {
        const audio = audioRef.current;
        const updateTime = () => setCurrentTime(audio.currentTime);
        const playNextTrackOnEnd = () => { playNextSong(true); }
        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("ended", playNextTrackOnEnd);
        return () => {
            audio.removeEventListener("timeupdate", updateTime);
            audio.removeEventListener("ended", playNextTrackOnEnd);
        };
    }, []);

    const addArtistToQueue = async (artistID) => {
        setJustAddedNewToQueue(true);
        const res = await fetch(`${apiBase}/read-write/artist-all-tracks/${artistID}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await res.json();
        const tracks = data.map((track) => track.id); // Extract the track name from the response
        setPlayQueue((prevQueue) => [...prevQueue, ...tracks]);
    }
    const shuffleArtistToQueue = async (artistID) => {
        const res = await fetch(`${apiBase}/read-write/artist-all-tracks/${artistID}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await res.json();
        const tracks = data.map((track) => track.id); // Extract the track name from the response
        setPlayQueue(_.shuffle(tracks));
        setQueuePointer(0); // Set the queue pointer to the first track
    }

    const playLibraryShuffle = async () => {
        fetch(`${apiBase}/read-write/all-songs`, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            console.log('setting play queue', data);
            setPlayQueue(_.shuffle(data));
            setQueuePointer(0); // Set the queue pointer to the first track
        });
    }

    return (
        <AudioPlayerContext.Provider 
        value={{/* all function logic */
            playTrack,
            currentTrackData,
            currentTime,
            isPlaying,
            toggleTrackPaused,
            playNextSong,
            trackCoverUrl,
            playPreviousSong,
            playingTrack,
            jumpTrackSeconds,
            jumpToPercent,
            addAlbumToQueue,
            playSuffle,
            playQueue,
            queuePointer,
            jumpToQueueTrack,
            deleteQueue,
            addArtistToQueue,
            shuffleArtistToQueue,
            playTrackNoQueue,
            playLibraryShuffle
            }}>
            {children}
        </AudioPlayerContext.Provider>
    );
}

//this is to import for the child components to call audio control functions
export const useAudioPlayer = () => useContext(AudioPlayerContext);