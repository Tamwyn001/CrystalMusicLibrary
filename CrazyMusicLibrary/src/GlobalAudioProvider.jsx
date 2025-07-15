import { createContext, useContext, useEffect, useRef, useState } from "react";
import apiBase from "../APIbase";
import { lerp, parseAudioDuration } from "../lib.js";
import _, { includes, method } from "lodash";
import EditAlbumInfos from "./components/EditAlbumInfos.jsx";
import CreatePlaylist from "./components/CreatePlaylist.jsx";
import TrackActions from "./components/TrackActions.jsx";
import { useNotifications } from "./GlobalNotificationsProvider.jsx";
import { useNavigate } from "react-router-dom";
import TagEditor from "./components/TagEditor.jsx";
import EditTagsWindow from "./components/EditTagsWindow.jsx";

const AudioPlayerContext = createContext(undefined);
const trackActionTypes = {
    TOP_QUEUE : "top_queue",
    END_QUEUE : 'end_queue',
    TAGS : "tags",
    GOTO_ALBUM :  "goto_album",
    REMOVE_FROM_PLAYLIST : "remove_from_playlist",
    ADD_TO_FAVORITES : "add_to_favs",
    REMOVE_FROM_FAVORITES : "remove_from_favs",
    NONE : "none"
}



//this is only for the top level component
export const AudioPlayerProvider = ({ children }) => {
    // all function logic
    const [playingTrack, setPlayingTrack] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackData, setCurrentTrackData] = useState({}); // Store track data here
    const [currentTime, setCurrentTime] = useState(0); // Store current time here
    const globalAudioRef = useRef(null); //audioRef that links either to A or B.
    const audioRefA = useRef(null); //
    const audioRefB = useRef(null); //
    const [playQueue, setPlayQueue] = useState([]); // Store play queue here
    const [trackCoverUrl, setTrackCoverUrl] = useState('null'); // Store track cover URL here
    const resolveTrackURL = (name) => `${name}` != 'null' ? `${apiBase}/read-write/music/${name}` : null; // Adjust the path as needed
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
        return  isNaN(stored) ? 0.5 : Math.min(1, Math.max(0, stored));;
      });
    const [creatingNewPlaylist, setCreatingNewPlaylist] = useState(false)
    const [ tagWindowOpen, setTagWindowOpen ] = useState(false);
    const playlistAddedCallback = useRef(null);
    const toggleTrackFavoriteWithActionBar = useRef(null);
    //=======
    const trackBlendIntervalRef = useRef(null); 
    const volumeTransitionInterval = useRef(null);
    const volumeRef = useRef(0);
    //call inside a mount
    const setupAudioGraph = () => {

        // NODE A
        audioRefA.current = new Audio();
        audioRefA.current.setAttribute("source", "A")


        // NODE B
        audioRefB.current = new Audio();
        audioRefB.current.setAttribute("source", "B")

        for (const audioRef of [audioRefA, audioRefB]){
            audioRef.current.crossOrigin = "anonymous";
            audioRef.current.playsInline = true;
            audioRef.current.setAttribute('webkit-playsinline', ''); // For iOS Safari compatibility
            audioRef.current.volume = parseFloat(localStorage.getItem('volume')) * 0.75 || 0.5;
        }
        resetAudioNodes();
        console.log("Audio graph setted up")
    };

    //call inside a mount
    const destructAudioGraph = () =>{
        console.log("Audio graph destructed")
        audioRefA.current?.pause();
        audioRefA.current = null;
        audioRefA.current?.disconnect();

        audioRefB.current?.pause();
        audioRefB.current = null;
        audioRefB.current?.disconnect();

        audioRefA.current?.removeEventListener("timeupdate", updateTime);
        audioRefA.current?.removeEventListener("ended", playNextTrackOnEnd);
        audioRefB.current?.removeEventListener("timeupdate", updateTime);
        audioRefB.current?.removeEventListener("ended", playNextTrackOnEnd);
    }

    const resetAudioNodes = () => {
        audioRefA.current?.pause();
        audioRefA.current.src = null;
        audioRefA.current.currentTime = 0;
        audioRefB.current?.pause();
        audioRefB.current.src = null;
        audioRefB.current.currentTime = 0;
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
        if(trackBlendTimeoutRef.current) clearTimeout(trackBlendTimeoutRef.current);
        if(shouldStopMusic || !globalAudioRef.current){return};
        
        console.log("Transition rescheduled, timesout in ", currentTrackData.rawDuration , globalAudioRef.current.currentTime , trackBlendTime, currentTrackData.rawDuration - globalAudioRef.current.currentTime - trackBlendTime);
        trackBlendTimeoutRef.current = setTimeout(() => {
            targetAudioHelperRef.current = targetAudioHelperRef.current === "A" ? "B": "A";
            playbackWithTransition(queuePointer + 1)
        }
        , (Math.min(currentTrackData.rawDuration - globalAudioRef.current.currentTime - trackBlendTime) * 1000), 0);
    }

    //We asume A just started playing. So need an inializer before, like audio A source = ...
    //this is only called if a track will follow
    const playbackWithTransition = async (newQueuePointer) => {
        const shouldStopMusic = playQueue.length <= newQueuePointer; 

        //if another track, we switch audios
        setQueuePointer(newQueuePointer);
        
        globalAudioRef.current = targetAudioHelperRef.current === "A" ? audioRefA.current : audioRefB.current; 
        const splittedTrackName = playQueue[newQueuePointer].split('.');
        const trackId = splittedTrackName.length != 0? splittedTrackName[0] : playQueue[newQueuePointer];
        await fetch(`${apiBase}/read-write/trackInfos/${trackId}`, {
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
        clearTimeout(trackBlendIntervalRef.current);
        setPlayingTrack(trackName);
        setIsPlaying(true);
        
        fetchTrackCover(trackName);
            
        console.log("Fading in", globalAudioRef.current)

        if(targetAudioHelperRef.current === "A"){  
            if(!shouldStopMusic){
                startNewTrackBlend(audioRefB, audioRefA);
                audioRefA.current.addEventListener("timeupdate", updateTime);
                audioRefA.current.addEventListener("ended", playNextTrackOnEnd);
            }else{
                startNewTrackBlend(audioRefB, null);
            }

            audioRefB.current.removeEventListener("timeupdate", updateTime);
            audioRefB.current.removeEventListener("ended", playNextTrackOnEnd);

        }else if(targetAudioHelperRef.current === "B"){
            if(!shouldStopMusic){
                startNewTrackBlend(audioRefA, audioRefB);
                audioRefB.current.addEventListener("timeupdate", updateTime);
                audioRefB.current.addEventListener("ended", playNextTrackOnEnd);
            }else{
                startNewTrackBlend(audioRefA, null);
            }

            audioRefA.current.removeEventListener("timeupdate", updateTime);
            audioRefA.current.removeEventListener("ended", playNextTrackOnEnd);
        }

    }
    const resetTransition = () =>{
        if(transitionTimoutRef.current) clearTimeout(transitionTimoutRef.current);
        if(trackBlendIntervalRef.current) clearInterval(trackBlendIntervalRef.current);
        //retarget all to node A
    }

    useEffect(() => {
        console.log('Changed inteval ref:', trackBlendIntervalRef.current);
    }, [trackBlendIntervalRef.current]);

    const startNewTrackBlend = ( fadingOutAudioRef, fadingInAudioRef ) => { //startIn in s
        if(trackBlendIntervalRef.current) clearInterval(trackBlendIntervalRef.current);
    
        const interval = 150; //ms
        let iter = 0;
        
        console.log('Init fadeout for:', fadingInAudioRef.current);
        trackBlendIntervalRef.current = setInterval( () => {
            const fadingInVolume = Math.min(1, Math.max(0, (iter * interval) / (trackBlendTime * 1000)));
            //we need a volume ref otherwise it will take the volume value at the first call and stick
            //with it.
            fadingInAudioRef.current.volume = fadingInVolume * volumeRef.current; 
            // addNotification(`Fade ref: ${fadingInAudioRef.current.volume}`, notifTypes.INFO);
            //we dont espacialy want to fadin a new track
            if(fadingOutAudioRef.current){
                fadingOutAudioRef.current.volume = (1 - fadingInVolume) * volumeRef.current;
            }
            if(fadingInVolume >= 1 ){
                clearInterval(trackBlendIntervalRef.current);
                trackBlendIntervalRef.current = null;
                if(fadingInAudioRef.current){
                    //only call this stop method if there is another track coming
                    //Otherwise the OnEndReached callback fires and stop the music. (queue end)
                    fadingOutAudioRef.current.pause();
                    fadingOutAudioRef.current.src = null;
                }
            }
            iter ++;
        }, interval);

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
            clearInterval(trackBlendIntervalRef.current);

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


    const getNextSongsFromAlbum = (trackId, onlyFavs = false) => {
        fetch(`${apiBase}/read-write/nextSongs/${container.type}/${container.id}/${onlyFavs}`, {
            method: 'GET',
            credentials : "include"
        }).then(res => res.json())
        .then(data => {
            setPlayQueue(data);
            console.log(data);
            setQueuePointer(data.findIndex(id => id === trackId));
            setShouldInitPlay(true);
        });
    }

    const playTrackNoQueue = (trackPath) => {
        setPlayQueue([trackPath]);

        setQueuePointer(0);
        setShouldInitPlay(true);
    };



    const playPreviousSong = () => {
        if (globalAudioRef.current.currentTime > 5 || queuePointer === 0) { // Check if the current time is greater than 3 seconds or if it's the first song
            globalAudioRef.current.currentTime = 0; // Reset the current time to 0
            rescheduleAudioTransition();
            return; // Don't play the previous song if the current time is less than 3 seconds
        }
        setQueuePointer(queuePointer - 1); // Move to the previous track in the queue
        setShouldInitPlay(true);
    };

    const playContainer = (containerId, containerType, onlyFavs = false) => {
        setShouldInitPlay(false);
        fetch(`${apiBase}/read-write/nextSongs/${containerType}/${containerId}/${onlyFavs}`, {
            method: 'GET',
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            setPlayQueue(data);
            setQueuePointer(0);
            setShouldInitPlay(true);        
        });
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
        fetch(`${apiBase}/read-write/nextSongs/${containerType}/${containerId}/${onlyFavs}`, { 
            method: 'GET',
            credentials : "include"
        }).then(res => res.json())
        .then(data => {
            setPlayQueue(_.shuffle(data));
            setShouldInitPlay(true);
            setQueuePointer(0);
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
        clearInterval(trackBlendIntervalRef.current);
        clearTimeout(trackBlendTimeoutRef.current);
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
        fetch(`${apiBase}/read-write/trackCover/${trackName}`, {
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
        setupAudioGraph();
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
        setQueuePointer(0);
    }

    const playLibraryShuffle = async () => {
        fetch(`${apiBase}/read-write/all-songs`, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            setPlayQueue(_.shuffle(data));
            setShouldInitPlay(true);
            setQueuePointer(0);
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
        if(!trackBlendIntervalRef.current){
            //only smooth audio outside of the transitions
            newVolumeTransition((clamped).toFixed(4) * 0.75);
        }
        volumeRef.current = clamped.toFixed(4) * 0.75;
        localStorage.setItem('volume', clamped);
    }, [volume]);

    const newVolumeTransition = (targetVolume) => {
        if(volumeTransitionInterval.current)clearInterval(volumeTransitionInterval.current);
        let iter = 0;
        const interval = 16; //60fps
        const startVolume = audioRefA.current.volume;

        volumeTransitionInterval.current = setInterval(() => {  
            // console.log(startVolume, targetVolume, iter * interval / 300);
            const currentVolume = lerp(startVolume, targetVolume, iter * interval / 300);

            audioRefA.current.volume = currentVolume;
            audioRefB.current.volume = currentVolume;
            if(targetVolume - startVolume > 0 ?
                currentVolume >= targetVolume : currentVolume <= targetVolume  ){
                clearInterval(volumeTransitionInterval.current);
                volumeTransitionInterval.current = null;
            }
            iter ++;
        }, interval);
        
    }
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

    const openTrackActions = (position, track, looseFocusCallback, toggleFavoriteCallback) => {
        // console.log(track, "at", position);
        setTrackActionContext({track, position});
        if(trackActionLoosesFocusRef.current)trackActionLoosesFocusRef.current();
        trackActionLoosesFocusRef.current = looseFocusCallback;
        toggleTrackFavoriteWithActionBar.current = toggleFavoriteCallback;
    }

    const closeTrackActions = () =>{
        setTrackActionContext(null);
        if(trackActionLoosesFocusRef.current)trackActionLoosesFocusRef.current();
    }

    const onClicTrackActionEntry = (type, track, callback = null) =>{
        closeTrackActions();
        switch(type){
            case trackActionTypes.NONE:
                return;
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
                break;
            case trackActionTypes.ADD_TO_FAVORITES:
                fetch(`${apiBase}/read-write/toggleFavorite/${track.id}/${true}`,{
                    method : 'GET',
                    credentials: "include"
                  })
                  .then(res => res.json())
                  .then((data) =>{
                    toggleTrackFavoriteWithActionBar.current(data);
                  });
              
                break;
            case trackActionTypes.REMOVE_FROM_FAVORITES:
                fetch(`${apiBase}/read-write/toggleFavorite/${track.id}/${false}`,{
                    method : 'GET',
                    credentials: "include"
                  })
                  .then(res => res.json())
                  .then((data) => {
                    toggleTrackFavoriteWithActionBar.current(data);
                  });
                break;
        }
    }
    const gotoTrackAlbum = (track) => {
        fetch(`${apiBase}/read-write/trackAlbumId/${track.id}`, {method : "GET"})
                .then(res => res.json())
                .then(id => {navigate(`albums/${id}`)});
    }
    const playTrackNext = (track) =>{
        const array = playQueue;
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
    };

    const linkNewContainer = (container, refreshCallback) => {
        albumAskRefreshRef.current = refreshCallback;
        setContainer(container);
    };

    const applyTrackEditTags = (tags, track) =>{
        setEdtitingTrackTags(null);
        if(!tags){return}
        const data = new FormData();
        data.append("current", JSON.stringify(tags.current));
        data.append("deleted", JSON.stringify(tags.deleted));

        fetch(`${apiBase}/read-write/changeTrackTags/${track}`,
            {method : "POST",
            credentials:"include",
            body: data})
        .then(res => res.json()).then(data => {addNotification("Tags upated!", notifTypes.SUCCESS)})
    };

    const playAudioSalad = async (salad = [], index) => {
        if(salad.length === 0) { return}
        setPlayQueue(salad);
        setQueuePointer(index || 0);
        setShouldInitPlay(true);

    };

    const openTagWindow = () => {
        setTagWindowOpen(true);
    };
    const closeTagWindow = () => {
        setTagWindowOpen(false);
    }

    return (
        <AudioPlayerContext.Provider 
        value={{
            playContainer,
            closeTagWindow,
            openTagWindow, 
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
            {(tagWindowOpen) && <EditTagsWindow/>}
        </AudioPlayerContext.Provider>
    );
}

//this is to import for the child components to call audio control functions
export const useAudioPlayer = () => {
    const context = useContext(AudioPlayerContext);
    if (context === undefined) {
      throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
    }
    return context;
  };