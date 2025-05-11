import { createContext, useContext, useEffect, useRef, useState } from "react";
import apiBase from "../APIbase";
import { parseAudioDuration } from "../lib.js";
import { AudioContext } from "standardized-audio-context";
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
    const audioCtxRef = useRef(null);
    const globalAudioRef = useRef(null); //audioRef that links either to A or B.
    const audioRefA = useRef(null); //
    const gainNodeRefA = useRef(null);
    const audioRefB = useRef(null); //
    const gainNodeRefB = useRef(null);
    const masterGainNodeRef = useRef(null);
    const [playQueue, setPlayQueue] = useState([]); // Store play queue here
    const [trackCoverUrl, setTrackCoverUrl] = useState('null'); // Store track cover URL here
    const resolveTrackURL = (name) => `${apiBase}/read-write/music/${name}`; // Adjust the path as needed
    const [queuePointer, setQueuePointer] = useState(-1); // Pointer to the current track in the queue
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
    const [ saladContext, setSaladContext] = useState(null)
    const targetAudioHelperRef = useRef('A');
    const trackBlendTimeoutRef = useRef(null);
    const [ trackBlendTime, setTrackBlendTime ] = useState(5); // s
    const [ shouldInitPlay, setShouldInitPlay ] = useState(false); // trigger flag when the user clics a track, not autoplay.
    const [volume, setVolume] = useState(() => {
        // Only runs once on mount
        const stored = parseFloat(localStorage.getItem('volume'));
        return isNaN(stored) ? 0.5 : Math.min(1, Math.max(0, stored));
      });
    const [creatingNewPlaylist, setCreatingNewPlaylist] = useState(false)
    const playlistAddedCallback = useRef(null);

    //call inside a mount
    const setupAudioGraph = () => {

        //MASTER VOLUME 
        const masterGain = audioCtxRef.current.createGain();
        masterGainNodeRef.current = masterGain;
        masterGain.connect(audioCtxRef.current.destination);

        // NODE A
        audioRefA.current = new Audio();
        audioRefA.current.setAttribute("source", "A")
        const sourceA = audioCtxRef.current.createMediaElementSource(audioRefA.current);
        const gainNodeA = audioCtxRef.current.createGain();
        sourceA.connect(gainNodeA);
        gainNodeA.connect(masterGain);
        gainNodeRefA.current = gainNodeA;
        audioRefA.current.crossOrigin = "anonymous";
        // NODE B
        audioRefB.current = new Audio();
        audioRefB.current.setAttribute("source", "B")

        const sourceB = audioCtxRef.current.createMediaElementSource(audioRefB.current);
        const gainNodeB = audioCtxRef.current.createGain();
        sourceB.connect(gainNodeB);
        gainNodeB.connect(masterGain);
        gainNodeRefB.current = gainNodeB;
        audioRefB.current.crossOrigin = "anonymous";
        resetAudioNodes();
        console.log("Audio graph setted up")
    };

    //call inside a mount
    const destructAudioGraph = () =>{
        console.log("Audio graph destructed")
        audioRefA.current?.pause();
        audioRefA.current = null;
        audioRefA.current?.disconnect();
        gainNodeRefA.current?.disconnect();

        audioRefB.current?.pause();
        audioRefB.current = null;
        audioRefB.current?.disconnect();
        gainNodeRefB.current?.disconnect();

        masterGainNodeRef.current?.disconnect();

        audioRefA.current?.removeEventListener("timeupdate", updateTime);
        audioRefA.current?.removeEventListener("ended", playNextTrackOnEnd);
        audioRefB.current?.removeEventListener("timeupdate", updateTime);
        audioRefB.current?.removeEventListener("ended", playNextTrackOnEnd);
    }

    const resetAudioNodes = () => {
        audioRefA.current?.pause();
        audioRefA.current.src = null;
        audioRefA.current.currentTime = 0;
        gainNodeRefA.current.gain.value = 0;
        audioRefB.current?.pause();
        audioRefB.current.src = null;
        audioRefB.current.currentTime = 0;
        gainNodeRefB.current.gain.value = 0;
        globalAudioRef.current = null;
        targetAudioHelperRef.current = "A";

        audioRefA.current.removeEventListener("timeupdate", updateTime);
        audioRefA.current.removeEventListener("ended", playNextTrackOnEnd);
        audioRefB.current.removeEventListener("timeupdate", updateTime);
        audioRefB.current.removeEventListener("ended", playNextTrackOnEnd);
    };


    useEffect(() =>{
        rescheduleAudioTransition();
    }, [currentTrackData]);

    const rescheduleAudioTransition = () => {
        const shouldStopMusic = playQueue.length <= queuePointer + 1; 
        clearTimeout(trackBlendTimeoutRef.current);
        if(shouldStopMusic || !globalAudioRef.current){return};
        
        console.log("Transition rescheduled, timesout in ", currentTrackData.rawDuration - globalAudioRef.current.currentTime - trackBlendTime);
        trackBlendTimeoutRef.current = setTimeout(() => {
            targetAudioHelperRef.current = targetAudioHelperRef.current === "A" ? "B": "A";
            playbackWithTransition(queuePointer + 1)
        }
        , (currentTrackData.rawDuration - globalAudioRef.current.currentTime - trackBlendTime) * 1000);
    }

    //We asume A just started playing. So need an inializer before, like audio A source = ...
    //this is only called if a track will follow
    const playbackWithTransition = async (newQueuePointer) => {
        const shouldStopMusic = playQueue.length <= newQueuePointer; 
        if (audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume();
          }

        //if another track, we switch audios
        setQueuePointer(newQueuePointer);
        
        globalAudioRef.current = targetAudioHelperRef.current === "A" ? audioRefA.current : audioRefB.current; 

        await fetch(`${apiBase}/read-write/trackInfos/${playQueue[newQueuePointer].split('.')[0]}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            data.duration = parseAudioDuration(data.rawDuration);
            setCurrentTrackData(data);
        });

        const trackName = playQueue[newQueuePointer]
        globalAudioRef.current.currentTime = 0; // Reset the current time if the track is already loaded
        if (globalAudioRef.current.src !== resolveTrackURL(trackName)) {
            globalAudioRef.current.src = resolveTrackURL(trackName); // Set the new track URL
        }else{
            
            setCurrentTime(0);
            return;
        }
        globalAudioRef.current.play();
        setPlayingTrack(trackName);
        setIsPlaying(true);
        
        fetchTrackCover(trackName);
            
        console.log("Fading in", globalAudioRef.current)
        const now = audioCtxRef.current.currentTime;
 
        if(targetAudioHelperRef.current === "A"){  
            if(!shouldStopMusic){
                gainNodeRefA.current.gain.setValueAtTime(0, now);// now
                gainNodeRefA.current.gain.linearRampToValueAtTime(1, now + 4);// now+ blendTime
                audioRefA.current.addEventListener("timeupdate", updateTime);
                audioRefA.current.addEventListener("ended", playNextTrackOnEnd);
            }
            //and reverse the ramp for the other audio
            gainNodeRefB.current.gain.linearRampToValueAtTime(1, now);// now
            gainNodeRefB.current.gain.linearRampToValueAtTime(0, now + trackBlendTime);// now+ blendTime



            audioRefB.current.removeEventListener("timeupdate", updateTime);
            audioRefB.current.removeEventListener("ended", playNextTrackOnEnd);

        }else if(targetAudioHelperRef.current === "B"){
            if(!shouldStopMusic){
                gainNodeRefB.current.gain.setValueAtTime(0, now);// now
                gainNodeRefB.current.gain.linearRampToValueAtTime(1, now + trackBlendTime);// now+ blendTime
                audioRefB.current.addEventListener("timeupdate", updateTime);
                audioRefB.current.addEventListener("ended", playNextTrackOnEnd);
            }
            gainNodeRefA.current.gain.linearRampToValueAtTime(1, now);// now
            gainNodeRefA.current.gain.linearRampToValueAtTime(0, now + trackBlendTime);// now+ blendTime


            audioRefA.current.removeEventListener("timeupdate", updateTime);
            audioRefA.current.removeEventListener("ended", playNextTrackOnEnd);
        }

    }

    const updateTime = () => setCurrentTime(globalAudioRef.current?.currentTime);
    const playNextTrackOnEnd = () => {

          if(playQueue.length > 0 && playQueue.length <= queuePointer + 1){
            stopMusic();}
        };

    useEffect(() => {
        if (!shouldInitPlay || queuePointer === -1 || playQueue.length === 0 ) {

            return; // avoid reseting the track to the beggining when just adding tracks to queue
        }
        resetAudioNodes();
        console.log("init Autoplay", playQueue, queuePointer, shouldInitPlay, audioRefA.current, audioRefB.current);
        playbackWithTransition(queuePointer);
        setShouldInitPlay(false);
    }, [playQueue, queuePointer, shouldInitPlay]);
    
    useEffect(() => {
        queuePointerRef.current = queuePointer;
    },[queuePointer])


    useEffect(() => {
        playQueueRef.current = playQueue;
        // console.log('PlayCueue updated', playQueueRef.current);
    },[playQueue])

    const toggleTrackPaused = () => {
        console.log(queuePointer);
        if (isPlaying) {
            globalAudioRef.current.pause();
            setIsPlaying(false);
            clearTimeout(trackBlendTimeoutRef.current);

        } else {
            setIsPlaying(true);
            if (queuePointer === -1 && playQueue.length !== 0 ) {
                setQueuePointer(0);
                return;
            }
            globalAudioRef.current.play();
            rescheduleAudioTransition();
        }
    }

    const setupAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
            setupAudioGraph(); // your function to connect audio nodes
        }
    
        if (audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume();
        }
    };

    const getNextSongsFromAlbum = (index) => {
        setupAudio();

        fetch(`${apiBase}/read-write/nextSongs/${container.type}/${container.id}`, {
            method: 'GET',
            credentials : "include"
        }).then(res => res.json())
        .then(data => {
            setPlayQueue(data);
            setQueuePointer(index);
            setShouldInitPlay(true);
        });
    }

    const playTrackNoQueue = (trackPath) => {
        setPlayQueue([trackPath]);
        setupAudio();
        setQueuePointer(0);
        setShouldInitPlay(true);
    };



    const playPreviousSong = () => {
        setupAudio();
        if (globalAudioRef.current.currentTime > 5 || queuePointer === 0) { // Check if the current time is greater than 3 seconds or if it's the first song
            globalAudioRef.current.currentTime = 0; // Reset the current time to 0
            rescheduleAudioTransition();
            return; // Don't play the previous song if the current time is less than 3 seconds
        }
        setQueuePointer(queuePointer - 1); // Move to the previous track in the queue
        setShouldInitPlay(true);
    };

    const addContainerToQueue = (containerId, containerType, onlyFavs = false) => {
        setShouldInitPlay(false);
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
        setupAudio();
        fetch(`${apiBase}/read-write/nextSongs/${containerType}/${containerId}/${onlyFavs}`, { 
            method: 'GET',
            credentials : "include"
        }).then(res => res.json())
        .then(data => {
            setPlayQueue(_.shuffle(data));
            setShouldInitPlay(true);

        });
    };

    const playNextSong = (useRefs = false) => {
        const queue = useRefs ? playQueueRef.current : playQueue;
        const pointer = useRefs ? queuePointerRef.current : queuePointer;
    
        if (queue.length <= pointer + 1) {
            stopMusic();
        }
        
        setQueuePointer(pointer + 1);
        setShouldInitPlay(true);
    };

    const stopMusic = () => {
        resetAudioNodes();
        setCurrentTime(0); // Reset the current time state
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
        const newTime = (percent / 100) * globalAudioRef.current.duration; // Calculate new time based on percent
        globalAudioRef.current.currentTime = newTime; // Set the new current time
        setCurrentTime(newTime); // Update the current time state
        rescheduleAudioTransition();
    }

    const jumpTrackSeconds = (seconds) => {
        if (globalAudioRef.current.currentTime + seconds > globalAudioRef.current.duration) {
            globalAudioRef.current.currentTime = globalAudioRef.current.duration; // Set to the end of the track
        } else if (globalAudioRef.current.currentTime + seconds < 0) {
            globalAudioRef.current.currentTime = 0; // Set to the beginning of the track
        } else {
            globalAudioRef.current.currentTime += seconds; // Jump forward or backward
        }
        setCurrentTime(globalAudioRef.current.currentTime); // Update the current time state
    }



    const jumpToQueueTrack = (index) => {
        if (index < 0 || index >= playQueue.length) return; // Ensure index is within bounds
        setShouldInitPlay(true)
        setQueuePointer(index);
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
        setVolume(parseFloat(localStorage.getItem('volume')) || 0.5);

        return () => {
            destructAudioGraph();
        }
    }, []);

    const addArtistToQueue = async (artistID) => {
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
        setupAudio();
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
        setShouldInitPlay(true);

    }

    const playLibraryShuffle = async () => {
        setupAudio();
        fetch(`${apiBase}/read-write/all-songs`, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            setPlayQueue(_.shuffle(data));
            setShouldInitPlay(true);

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
        masterGainNodeRef.current?.gain.linearRampToValueAtTime((clamped).toFixed(4) * 0.75, audioCtxRef.current.currentTime + 0.2);
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
    }

    const applyTrackEditTags = (tags, track) =>{
        setEdtitingTrackTags(null);
        if(!tags){return}
        console.log("parsed tags:", tags);
        const data = new FormData();
        data.append("current", JSON.stringify(tags.current));
        data.append("deleted", JSON.stringify(tags.deleted));

        fetch(`${apiBase}/read-write/changeTrackTags/${track}`,
            {method : "POST",
            credentials:"include",
            body: data})
        .then(res => res.json()).then(data => {addNotification("Tags upated!", notifTypes.SUCCESS)})
    }

    const playAudioSalad = async (salad = [], index) => {
        if(salad.length === 0) { return}
        setPlayQueue(salad);
        setQueuePointer(index || 0);
        if(!index){

        }
    }


    return (
        <AudioPlayerContext.Provider 
        value={{/* all function logic */  
            saladContext,
            setSaladContext,  
            playAudioSalad,
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
            {(editingTrackTags) && <TagEditor apply={applyTrackEditTags} track={editingTrackTags}/>}
        </AudioPlayerContext.Provider>
    );
}

//this is to import for the child components to call audio control functions
export const useAudioPlayer = () => useContext(AudioPlayerContext);