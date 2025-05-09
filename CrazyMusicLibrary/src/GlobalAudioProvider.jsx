import { createContext, useContext, useEffect, useRef, useState } from "react";
import apiBase from "../APIbase";
import { parseAudioDuration } from "../lib.js";

import _, { includes, method } from "lodash";
import EditAlbumInfos from "./components/EditAlbumInfos.jsx";
import CreatePlaylist from "./components/CreatePlaylist.jsx";
import TrackActions from "./components/TrackActions.jsx";
import { useNotifications } from "./GlobalNotificationsProvider.jsx";
import { useNavigate } from "react-router-dom";
import TagEditor from "./components/TagEditor.jsx";

const AudioPlayerContext = createContext();
const trackActionTypes = {
    TOP_QUEUE : "top_queue",
    END_QUEUE : 'end_queue',
    TAGS : "tags",
    GOTO_ALBUM :  "goto_album",
    REMOVE_FROM_PLAYLIST : "remove_from_playlist",
    NONE : "none"
}

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
    const [queuePointer, setQueuePointer] = useState(-1); // Pointer to the current track in the queue
    const [justAddedNewToQueue, setJustAddedNewToQueue] = useState(false); // Flag to indicate if a new track was added to the queue
    const playQueueRef = useRef(playQueue);
    const queuePointerRef = useRef(queuePointer);
    const [editingAlbum, setEditingAlbum] = useState(null); // Flag to indicate if the album is being edited
    const albumAskRefreshRef = useRef(null); // Contains the refresh callback 
    const [ trackActionContext, setTrackActionContext ] = useState(null);
    const trackActionLoosesFocusRef = useRef(null);
    const {addNotification, notifTypes} = useNotifications();
    const navigate = useNavigate();
    const [ container, setContainer] = useState(null); //{id, type : "album"||"playlist"||..}
    const [ editingTrackTags, setEdtitingTrackTags ] = useState(null)

    const [volume, setVolume] = useState(() => {
        // Only runs once on mount
        const stored = parseFloat(localStorage.getItem('volume'));
        return isNaN(stored) ? 0.5 : Math.min(1, Math.max(0, stored));
      });
    const [creatingNewPlaylist, setCreatingNewPlaylist] = useState(false)
    const playlistAddedCallback = useRef(null)
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
        fetch(`${apiBase}/read-write/nextSongs/${container.type}/${container.id}`, {
            method: 'GET',
            credentials : "include"
        }).then(res => res.json())
        .then(data => {
            console.log('setting play queue');
            setPlayQueue(data);
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
        if(queuePointer === -1 || playQueue.length === 0 )return;
        resolvetrack(playQueue[queuePointer])
    },[queuePointer, playQueue]); // Update the queue pointer when the play queue changes

    // useEffect(() => {console.log(queuePointer)}, [queuePointer]); // Log the queue pointer when it changes

    const playPreviousSong = () => {
        if (audioRef.current.currentTime > 5 || queuePointer === 0) { // Check if the current time is greater than 3 seconds or if it's the first song
            audioRef.current.currentTime = 0; // Reset the current time to 0
            return; // Don't play the previous song if the current time is less than 3 seconds
        }
        setQueuePointer(queuePointer - 1); // Move to the previous track in the queue
    };

    const addContainerToQueue = (containerId, containerType, onlyFavs = false) => {
        setJustAddedNewToQueue(true);
        fetch(`${apiBase}/read-write/nextSongs/${containerType}/${containerId}/${onlyFavs}`, {
            method: 'GET',
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            setPlayQueue((prevQueue) => [...prevQueue, ...data]);        
        });
    };

    const playContainerSuffle = (containerId, containerType, onlyFavs = false) => {
        console.log(`${apiBase}/read-write/nextSongs/${containerType}/${containerId}/${onlyFavs}`);
        fetch(`${apiBase}/read-write/nextSongs/${containerType}/${containerId}/${onlyFavs}`, { 
            method: 'GET',
            credentials : "include"
        }).then(res => res.json())
        .then(data => {
            setPlayQueue(_.shuffle(data));
            setQueuePointer(0); //we do this here to this when the useEffect fires, both are updated.
        });
    };

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

    const playTrack = (index) => {
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
        console.log(parseFloat(localStorage.getItem('volume')));
        setVolume(parseFloat(localStorage.getItem('volume')) || 0.5)
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

    const editAlbum = (albumID) => {
        console.log('Editing album', albumID);
        fetch(`${apiBase}/read-write/album/${albumID}`, {
            method: 'GET', credentials: 'include'})
        .then(res=> res.json())
        .then((data) => {
            const {albumInfos, genres, tracks, artists} = data;
            setEditingAlbum({
                id: albumID,
                coverURL: `${apiBase}/covers/${albumInfos.cover}`,
                tracks,
                type : "album",
                name: albumInfos.title,
                artist: artists.map((artist) => artist.name),
                year: albumInfos.release_date,
                description: albumInfos.description,
                genre: genres.map((genre) => genre.genreName)});
        });
        return;
    }

    const editPlaylist = (playlistId) => {
        fetch(`${apiBase}/read-write/playlist/${playlistId}/${true}`, {
            method: 'GET', credentials: 'include'})
        .then(res=> res.json())
        .then((data) => {
            const {playlistInfos, collaborators} = data;
            setEditingAlbum({
                id: playlistInfos.id,
                type : "playlist",
                coverURL: `${apiBase}/covers/${playlistInfos.cover}`,
                name: playlistInfos.title,
                description: playlistInfos.description,
                collaborators : collaborators
            });
        });
        return;
    }

    useEffect(() => {
        // Avoid setting state here again! Just apply it.
        const clamped = Math.min(1, Math.max(0, volume));
        audioRef.current.volume = (clamped).toFixed(4) * 0.75;
        localStorage.setItem('volume', clamped);
    }, [volume]);

    const applyContainerChanges = (containerClass, file = null) => {
        if(!containerClass) { //no changes made
            console.log('No changes made');
            setEditingAlbum(null);
            return;
        }
        const data = new FormData();
        data.append(`${containerClass.type}`, JSON.stringify(containerClass));
        //for uploading a new cover we need an object album.uuid, album.ext
        if(file) {
            data.append('cover', file);
        }
        fetch(`${apiBase}/read-write/editContainer/${containerClass.type}`, 
            {method: 'POST',
            credentials: 'include',
            body: data})
        .then(()=> {
            setEditingAlbum(null); 
            albumAskRefreshRef.current();    
        })
    }

    const createNewPlaylist = async () => {
        setCreatingNewPlaylist(true)
    } //async bc there is a callback for the button
    
    const sendNewPlaylist = (playlist, coverFile) => {
        console.log("sending playlist", playlist)
        const data = new FormData();
        data.append("playlist", JSON.stringify(playlist))
        if(coverFile) {
            data.append("cover", coverFile);
            console.log(coverFile);
        }
        fetch(`${apiBase}/read-write/newPlaylist`, {
            method : "POST",
            credentials : "include",
            body : data
        })
        .then(() => {
            setCreatingNewPlaylist(false);
            playlistAddedCallback.current();
        })
    }

    const closeNewPlaylistWindow = () =>{
        setCreatingNewPlaylist(false);
    }

    const openTrackActions = (position, track, looseFocusCallback) => {
        console.log(track, "at", position);
        setTrackActionContext({track, position});
        if(trackActionLoosesFocusRef.current)trackActionLoosesFocusRef.current();
        trackActionLoosesFocusRef.current = looseFocusCallback;
    }

    const closeTrackActions = () =>{
        setTrackActionContext(null);
        if(trackActionLoosesFocusRef.current)trackActionLoosesFocusRef.current();
    }

    const onClicTrackActionEntry = (type, track) =>{
        closeTrackActions();
        console.log(track);
        console.log(type, track.id);
        switch(type){
            case trackActionTypes.TOP_QUEUE:
                playTrackNext(track);
                break;
            case trackActionTypes.END_QUEUE:
                playTrackEnd(track);
                break;
            case trackActionTypes.GOTO_ALBUM:
                gotoTrackAlbum(track);
                break;
            case trackActionTypes.REMOVE_FROM_PLAYLIST:
                deleteTrackFromPlaylist(track);
                break;
            case trackActionTypes.TAGS:
                setEdtitingTrackTags(track);
                addNotification(`Avaliable soon :)`, notifTypes.INFO);
                break
        }
    }
    const gotoTrackAlbum = (track) => {
        fetch(`${apiBase}/read-write/trackAlbumId/${track.id}`, {method : "GET"})
                .then(res => res.json())
                .then(id => {navigate(`albums/${id}`)});
    }
    const playTrackNext = (track) =>{
        const array = playQueue
        array.splice(queuePointer + 1, 0, track.id);
        setPlayQueue(array);
        addNotification(`${track.title} playing next.`, notifTypes.SUCCESS);
    }
    const playTrackEnd = (track) => {
        const array = playQueue
        array.push(track.id);
        setPlayQueue(array);
        addNotification(`${track.title} playing at the end.`, notifTypes.INFO);
    }
    const deleteTrackFromPlaylist = (track) => {
        fetch(`${apiBase}/read-write/deleteTrackFromPlaylist/${container.id}/${track.id}`,
            {method : "DELETE", credentials: "include"})
            .then(res => res.json())
            .then(data => {
               albumAskRefreshRef.current();
               addNotification(`${track.title} removed.`, notifTypes.SUCCESS);})
    }

    const linkNewContainer = (container, refreshCallback) => {
        albumAskRefreshRef.current = refreshCallback;
        setContainer(container);
        console.log(container, refreshCallback);
    }


    return (
        <AudioPlayerContext.Provider 
        value={{/* all function logic */    
            linkNewContainer,
            trackActionTypes,
            onClicTrackActionEntry,
            openTrackActions,
            getNextSongsFromAlbum,
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
            addContainerToQueue,
            playContainerSuffle,
            playQueue,
            queuePointer,
            jumpToQueueTrack,
            deleteQueue,
            addArtistToQueue,
            shuffleArtistToQueue,
            playTrackNoQueue,
            playLibraryShuffle,
            setVolume,
            volume,
            editAlbum,
            editPlaylist,
            createNewPlaylist,
            setPlaylistAddedCallback : (fn) => {
                playlistAddedCallback.current = fn;
            },

            }}>
            {children}
            {(editingAlbum) ? ( 
                editingAlbum.type === "album" ? <EditAlbumInfos applyCanges={applyContainerChanges} albumClass={editingAlbum}/>
                : editingAlbum.type === "playlist" ? <CreatePlaylist editPlaylistClass={editingAlbum} applyCanges={applyContainerChanges}/> 
                : null) : null
            }
            {(creatingNewPlaylist) && <CreatePlaylist closeOverlay={closeNewPlaylistWindow} applyCanges={sendNewPlaylist}/>}
            {(trackActionContext) ? <TrackActions isFav={container.favPlaylist}trackY={trackActionContext.position.y}  track={trackActionContext.track} />: null}
            {(editingTrackTags) && <TagEditor track={editingTrackTags}/>}
        </AudioPlayerContext.Provider>
    );
}

//this is to import for the child components to call audio control functions
export const useAudioPlayer = () => useContext(AudioPlayerContext);