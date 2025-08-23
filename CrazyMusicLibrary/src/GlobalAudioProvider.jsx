import { createContext, useContext, useEffect, useRef, useState } from "react";
import apiBase from "../APIbase";
import { contrastRatio, lerp, parseAudioDuration } from "../lib.js";
import EditAlbumInfos from "./components/EditAlbumInfos.jsx";
import CreatePlaylist from "./components/CreatePlaylist.jsx";
import TrackActions from "./components/TrackActions.jsx";
import { useNotifications } from "./GlobalNotificationsProvider.jsx";
import { renderMatches, useLocation, useNavigate } from "react-router-dom";
import TagEditor from "./components/TagEditor.jsx";
import EditTagsWindow from "./components/EditTagsWindow.jsx";
import EditArtistInfos from "./components/EditArtistInfos.jsx";
import { useEventContext } from "./GlobalEventProvider.jsx";
import _ from "lodash";
import ColorThief from "../third_party_modules/color-thief/dist/color-thief.mjs"

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
const useRoutingHistory = () => {
    const location = useLocation();
    const historyRef = useRef({pointer : 0, history : new Array(6).fill(null)});
  

    useEffect(() => {
        const { pointer, history } = historyRef.current;
    
        // Calculate previous index safely (wrap around circular buffer)
        const prevIndex = (pointer - 1 + history.length) % history.length;
    
        // Avoid adding duplicate if same as previous
        if (history[prevIndex] === location.pathname) return;
    
        // Store current location
        history[pointer] = location.pathname;
    
        // Move pointer forward (wrap around)
        historyRef.current.pointer = (pointer + 1) % history.length;
    
      }, [location]);
  
    return historyRef.current;
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
    const [editingArtist, setEditingArtist] = useState(null); // Flag to indicate if the album is being edited
    const {emit, subscribe} = useEventContext();
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

    /** For radios that are not stored, we need to pass the metadata on the fly.
    * There are not stored in the queue so we set them externaly from LibRadioCard
    * and gets invalid when a valid radio/song from the database get palyed.
    */
    const externalRadioInfos = useRef(null);

    //== Audio analysis
    const fftConfigRef = useRef(null);
    const writeIndexRef = useRef(0);
    const circularBufferRef = useRef(null);
    const lastBufferedEndChunk = useRef(0); 
    const bufferStartChunkRef = useRef(0); 
    const SECONDS_TO_BUFFER = 5;
    const FFTcurrentTrack = useRef("");
    const FFTUserSetingsRef = useRef(null);
    const lastTimeRef = useRef(0);
    const audioTimeTrackingRef = useRef({
        lastAudioTime: 0,
        lastPerformanceNow: 0
    });
    const resnapIntervalRef = useRef(null);
    const DRIFT_THRESHOLD = 0.1; // seconds

    //== Song full screen
    const fullScreenMode = useRef(false);
        const location = useLocation();
    const locationBeforeFullScreen = useRef("");
    /**The two colors displayed innto the full screen */
    const colorOverride = useRef([]);
    /**The object containing all the colors to a song */
    const paletteRef = useRef({track : "", pairs : []});
    const fullScreenImage = useRef(null);
    const history = useRoutingHistory();
    //call inside a mount
    const setupAudioGraph = () => {

        // NODE A
        audioRefA.current = new Audio();
        audioRefA.current.setAttribute("source", "A")
        audioRefA.current.addEventListener('error', (e) => {
            //Exit to avoid adding the current spoofing URI into a new one.
            if(audioRefA.current.src.includes("spoof")){return;}
            const error = audioRefA.current.error;
            if (error) {
              console.warn('Audio error occurred: code', error.code);
              // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED (common for 403s or CORS)
              if (error.code === 4 && playingTrack) {
                // fallback to backend stream.
                const proxied = `${apiBase}/radio/spoof/${encodeURIComponent(audioRefA.current.src)}`;
                audioRefA.current.src = proxied;
                addNotification("Audio stream not reachable from browser. Streaming from backend..", notifTypes.INFO);
                setIsPlaying(true);
                audioRefA.current.play();
                
                const source = new EventSource(`${apiBase}/radio/trackStream/${encodeURIComponent(audioRefA.current.src)}`);
            
                source.onmessage = (event) => {
                    console.log(event);
                    const data = JSON.parse(event.data);
                    console.log("Now playing:", data.metadata.StreamTitle);
                    const title = data.metadata.adw_ad == "true" ? 
                        "Advertisment - " + `${(Number(data.metadata.durationMilliseconds)/1000).toFixed(1)}s`: 
                        data.metadata.StreamTitle;
                    setCurrentTrackData(old => {return {...old, title : title}});
                };
        
                source.addEventListener("error", (e) => {
                    console.warn("Metadata stream error", e);
                });
              }
            }
          });
          
          audioRefA.current.addEventListener('canplay', () => {
            console.log('Stream is playable!');
          });
          

        // NODE B
        audioRefB.current = new Audio();
        audioRefB.current.setAttribute("source", "B")

        for (const audioRef of [audioRefA, audioRefB]){
            audioRef.current.crossOrigin = "anonymous";
            audioRef.current.playsInline = true;
            audioRef.current.setAttribute('webkit-playsinline', ''); // For iOS Safari compatibility
            audioRef.current.volume = parseFloat(localStorage.getItem('volume')) * 0.75 || 0.5;
        }
        audioRefA.current?.addEventListener('timeupdate', detectSeek);
        audioRefB.current?.addEventListener('timeupdate', detectSeek);
        audioRefA.current?.addEventListener('playing', onPlaying);
        audioRefB.current?.addEventListener('playing', onPlaying);
        audioRefA.current?.addEventListener("play", handlePlay);
        audioRefA.current?.addEventListener("pause", handlePause);
        audioRefB.current?.addEventListener("play", handlePlay);
        audioRefB.current?.addEventListener("pause", handlePause);
        resetAudioNodes();

    


        // // The audio analysis plugs the web audio api onto the source
        // // but does not alter it. Makes it work for Safari.
        // // We use references for React.
        // audioCtx.current = new AudioContext();
        // mixer.current = audioCtx.current.createGain();
        // sourceA.current = audioCtx.current.createMediaElementSource(audioRefA.current);
        // sourceB.current = audioCtx.current.createMediaElementSource(audioRefB.current);
        // sourceA.current.connect(mixer.current);
        // sourceB.current.connect(mixer.current);
        // analyzer.current = audioCtx.current.createAnalyser();
        // mixer.current.connect(analyzer.current);

        // analyzer.current.fftSize = 256;
        // const bufferLength = analyzer.current.frequencyBinCount;
        // frequencyDataArray.current = new Uint8Array(bufferLength);
        // analyzer.current.getByteFrequencyData(frequencyDataArray.current);
        console.log("Audio graph setted up")
    };

    // if(analyzer.current && frequencyDataArray.current){
    //     analyzer.current.getByteFrequencyData(frequencyDataArray.current);
    // }
    //call inside a mount
    const destructAudioGraph = () =>{
        console.log("Audio graph destructed")
        audioRefA.current?.pause();
        // audioRefA.current?.disconnect();
        audioRefA.current = null;
        audioRefB.current?.pause();
        // audioRefB.current?.disconnect();
        audioRefB.current = null;

        audioRefA.current?.removeEventListener("timeupdate", updateTime);
        audioRefA.current?.removeEventListener("ended", playNextTrackOnEnd);
        audioRefA.current?.removeEventListener('error');
        audioRefA.current?.removeEventListener('canplay');
        audioRefB.current?.removeEventListener("timeupdate", updateTime);
        audioRefB.current?.removeEventListener("ended", playNextTrackOnEnd);
        audioRefA.current?.removeEventListener('timeupdate', detectSeek);
        audioRefB.current?.removeEventListener('timeupdate', detectSeek);
        audioRefA.current?.removeEventListener('playing', onPlaying);
        audioRefB.current?.removeEventListener('playing', onPlaying);
        audioRefA.current?.removeEventListener("play", handlePlay);
        audioRefA.current?.removeEventListener("pause", handlePlay);
        audioRefB.current?.removeEventListener("play", handlePlay);
        audioRefB.current?.removeEventListener("pause", handlePlay);
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

    const onPlaying = () => {
        if(!fftConfigRef.current){return;}
        console.log("Record start playing", globalAudioRef.current.currentTime);
        audioTimeTrackingRef.current.lastAudioTime = globalAudioRef.current.currentTime;
        audioTimeTrackingRef.current.lastPerformanceNow = performance.now();
    };
    const snapIntervalCallback = () => {
        const audio = globalAudioRef.current;
        if (!audio || audio.paused) return;
        // console.log(audioRefA.current.currentTime, audioRefB.current.currentTime, audio.currentTime , getAccurateTime(), Math.abs(audio.currentTime - getAccurateTime()))
        if (Math.abs(audio.currentTime - getAccurateTime()) > DRIFT_THRESHOLD) {
            resetTracking();
        }
    }
    const startResnapInterval = () => {
        const RESNAP_INTERVAL = 5000; // every 5 seconds
        //tiny delay to sync when audio started
        setTimeout(snapIntervalCallback, 200);
        const intervalId = setInterval(snapIntervalCallback, RESNAP_INTERVAL);
    
        return intervalId;
    };


    const handlePlay = () => {
        if(!fftConfigRef.current){return;}
        resetTracking();
        if (resnapIntervalRef.current) clearInterval(resnapIntervalRef.current);
        resnapIntervalRef.current = startResnapInterval();
    };
    
    const handlePause = () => {
        if (resnapIntervalRef.current) {
            clearInterval(resnapIntervalRef.current);
            resnapIntervalRef.current = null;
        }
    };

    const detectSeek = () => {
        if(!fftConfigRef.current || ! globalAudioRef.current){return;}
        const t = globalAudioRef.current.currentTime;
        
        if (Math.abs(t - lastTimeRef.current) > 1.0) {
            const CHUNKS_PER_SECOND = Math.round(1 / fftConfigRef.current.interval);
            const TOTAL_CHUNKS = SECONDS_TO_BUFFER * CHUNKS_PER_SECOND;
            const seekChunk = Math.floor(t * CHUNKS_PER_SECOND);
            console.log("Seeking chunk", seekChunk, TOTAL_CHUNKS, CHUNKS_PER_SECOND, SECONDS_TO_BUFFER);
            writeIndexRef.current = 0;

             // This tells us: chunk 0 in buffer == chunk N in audio
            bufferStartChunkRef.current = seekChunk; 
            bufferFFTData(FFTcurrentTrack.current, seekChunk, seekChunk + TOTAL_CHUNKS);
        }else{
            maybeFetchFFT(FFTcurrentTrack.current, t);
        }
        lastTimeRef.current = t;
    };

    useEffect(() =>{
        if(!currentTrackData){ return; } 
        // Radios do not need transitions. 
        if(currentTrackData.type === 'radio'){ return; } 
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
        
        globalAudioRef.current = targetAudioHelperRef.current === "A" ?
            audioRefA.current : audioRefB.current; 

        
        if(playQueue[newQueuePointer].startsWith("radio-")){
            // Radios are passed as an object instead of a string (song uuid).
            let radioDetails = {};
            if(playQueue[newQueuePointer].startsWith("radio-id")){
                const radioUuid = playQueue[newQueuePointer].split("radio-id:")[1];
                // We expect newQueuePointer to always be 0.
                radioDetails = await fetch(`${apiBase}/radio/${radioUuid}`)
                    .then(res=>res.json());
                console.log(radioDetails);
                externalRadioInfos.current = null; 
                setCurrentTrackData({type : 'radio', artist : radioDetails.name,
                    ...radioDetails, duration : "0-", uuid : radioUuid});
   
            } else {
                radioDetails.url = playQueue[newQueuePointer].split("radio-url:")[1];
                console.log(externalRadioInfos.current);
                const {name : artist, ...rest} = externalRadioInfos.current;
                const infos = {artist, ...rest};
                setCurrentTrackData({type : 'radio', ...infos, duration : "0-"});
   
            }
            globalAudioRef.current.src = radioDetails.url;
            
            const source = new EventSource(`${apiBase}/radio/trackStream/${encodeURIComponent(radioDetails.url)}`);
            
            source.onmessage = (event) => {
                console.log(event);
                const data = JSON.parse(event.data);
                console.log("Now playing:", data.metadata.StreamTitle);
                setCurrentTrackData(old => {return {...old, title : data.metadata.StreamTitle}});
            };
            setPlayingTrack('');
            source.addEventListener("error", (e) => {
                console.warn("Metadata stream error", e);
            });
            resetTransition();
            audioRefB.current.removeEventListener("timeupdate", updateTime);
            audioRefB.current.removeEventListener("ended", playNextTrackOnEnd);
            setIsPlaying(true);
            globalAudioRef.current.play();

            
            return;
            
        }
        externalRadioInfos.current = null;
        const trackId = playQueue[newQueuePointer];
        await fetch(`${apiBase}/read-write/trackInfos/${trackId}`, {
            method: 'GET'
        })
        .then(res => res.json())
        .then(data => {
            data.duration = parseAudioDuration(data.rawDuration);
            setCurrentTrackData(data);
        });

       
        globalAudioRef.current.currentTime = 0; // Reset the current time if the track is already loaded

        await fetch(`${apiBase}/read-write/fftConfig/${trackId}`, {
            method :"GET",
            credentials : "include"
        }).then(async res => {
            writeIndexRef.current = 0;
            bufferStartChunkRef.current = 0;
            lastBufferedEndChunk.current = 0;
            
            if(!res.ok){
                fftConfigRef.current = null;
                return;
            }
            const data = await res.json()
            fftConfigRef.current = JSON.parse(data);
            console.log(fftConfigRef.current);
            const CHUNK_SIZE = fftConfigRef.current.fftSize * 1; // one value on int16
            const TOTAL_CHUNKS = SECONDS_TO_BUFFER / fftConfigRef.current.interval; 
            circularBufferRef.current = new Int16Array(TOTAL_CHUNKS * CHUNK_SIZE);
            console.log("New buffer!");
        })


        if (globalAudioRef.current.src !== resolveTrackURL(trackId)) {
            globalAudioRef.current.src = resolveTrackURL(trackId); // Set the new track URL
        }else{
            
            setCurrentTime(0);
            return;
        }
        globalAudioRef.current.play();
        clearTimeout(trackBlendIntervalRef.current);
        setPlayingTrack(trackId);
        FFTcurrentTrack.current = trackId;
        setIsPlaying(true);
        
        fetchTrackCover(trackId);
            
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
        };

    }

    const bufferFFTData = async (trackId, fromChunk, toChunk) => {
        if(!fftConfigRef.current) {
            circularBufferRef.current = null;
            return null};
        const CHUNK_BYTES = fftConfigRef.current.fftSize * 1 * 2; //int16 has 2 bytes, for one value
        const startByte = CHUNK_BYTES * fromChunk;
        const endByte = CHUNK_BYTES * toChunk;
        // const [startByte, endByte] = getByteRangeForTime(audioTime);

        const res = await fetch(`${apiBase}/read-write/fft/${trackId}`, {
          headers: {
            Range: `bytes=${startByte}-${endByte - 1}`
          }
        });
      
        if (!res.ok && res.status !== 206) {
          console.error("Failed to stream FFT data");
          return;
        }
        lastBufferedEndChunk.current = Math.floor(toChunk);
      
        const buffer = await res.arrayBuffer();

        const incoming = new Int16Array(buffer);
        const CHUNK_SIZE = fftConfigRef.current.fftSize * 1; //One value
        const numChunks = incoming.length / CHUNK_SIZE;

        const CHUNK_DURATION = fftConfigRef.current.interval; // e.g., 0.1s
        const TOTAL_CHUNKS = SECONDS_TO_BUFFER / CHUNK_DURATION;
        // Imagine a buffer [=======] where ariving at the end makes it writing back from the start (%).
        let writeIndexStart = writeIndexRef.current;
        for (let i = 0; i < numChunks; i++) {
            const offset = i * CHUNK_SIZE;
            const writeIndex = (writeIndexStart + i) % TOTAL_CHUNKS;
    
            circularBufferRef.current.set(
                incoming.subarray(offset, offset + CHUNK_SIZE),
                writeIndex * CHUNK_SIZE
            );
        }
        
        writeIndexRef.current = (writeIndexStart + numChunks) % TOTAL_CHUNKS;
    };

    const resetTracking = () => {
        audioTimeTrackingRef.current.lastAudioTime = globalAudioRef.current.currentTime;
        audioTimeTrackingRef.current.lastPerformanceNow = performance.now();
    };
    
    const getHighPrecisionAudioTime = () => {
        const { lastAudioTime, lastPerformanceNow } = audioTimeTrackingRef.current;
        const elapsed = (performance.now() - lastPerformanceNow) / 1000;
        return lastAudioTime + elapsed;
    };

    const getAccurateTime = () => {
        if (globalAudioRef.current.paused) return globalAudioRef.current.currentTime;
        return getHighPrecisionAudioTime();
    };
    
    const maybeFetchFFT = (trackId, currentTime) => {
        const CHUNKS_PER_SECOND = Math.round(1 / fftConfigRef.current.interval);
        const currentChunk = Math.floor(currentTime * CHUNKS_PER_SECOND);
        const remainingBufferedChunks = Math.floor(lastBufferedEndChunk.current) - currentChunk;
        const TOTAL_CHUNK_TO_BUFFER = CHUNKS_PER_SECOND * SECONDS_TO_BUFFER;
        const missingChunks  =  TOTAL_CHUNK_TO_BUFFER - remainingBufferedChunks
        if (missingChunks < 1) return;
        
        bufferFFTData(trackId, 
            Math.floor(lastBufferedEndChunk.current), 
            TOTAL_CHUNK_TO_BUFFER + currentChunk);
        
    };

    const getCurrentFFTChunkIndex = () => {
        const CHUNKS_PER_SECOND = Math.round(1 / fftConfigRef.current.interval);
        const currentChunk = Math.floor(getAccurateTime() * CHUNKS_PER_SECOND);

        const relativeChunk = currentChunk - bufferStartChunkRef.current;
        const TOTAL_CHUNKS = SECONDS_TO_BUFFER * CHUNKS_PER_SECOND;

        // if (relativeChunk < 0 || relativeChunk >= TOTAL_CHUNKS) {
        //     return null; // Not in buffer!
        // }

        const circularIndex = relativeChunk % TOTAL_CHUNKS;
        return circularIndex;
    };


    const getFFTAtCurrentTime = () => {
        if (!fftConfigRef.current || !circularBufferRef.current) {
            return null;
        }
    
        const CHUNK_SIZE = fftConfigRef.current.fftSize * 1; // One value per bin
        const chunkIndex = getCurrentFFTChunkIndex();
        
        if (chunkIndex === null) return null;
    
        const TOTAL_CHUNKS = Math.floor(SECONDS_TO_BUFFER / fftConfigRef.current.interval);
        const totalBufferSize = TOTAL_CHUNKS * CHUNK_SIZE;
    
        const start = chunkIndex * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
    
        if (end > totalBufferSize) return null; // Avoid out-of-bounds
    
        return circularBufferRef.current.slice(start, end);
    };


    const resetTransition = () =>{
        if(trackBlendIntervalRef?.current) clearInterval(trackBlendIntervalRef.current);
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
            stopMusic();
        }
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
        if(!globalAudioRef.current && playQueueRef.current.length > 0){
            setQueuePointer(0);
            setShouldInitPlay(true);
            return;
        }
        if (isPlaying) {
            globalAudioRef.current?.pause();
            setIsPlaying(false);
            clearTimeout(trackBlendTimeoutRef.current);
            clearInterval(trackBlendIntervalRef.current);

        } else {
            setIsPlaying(true);
            if (queuePointer === -1 && playQueue.length !== 0 ) {
                setQueuePointer(0);
                return;
            }
            globalAudioRef.current?.play();
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
            console.log("stop");
        }
        
        setQueuePointer(pointer + 1);
        setShouldInitPlay(true);
    };

    const stopMusic = () => {
        resetAudioNodes();
        setCurrentTime(0); // Reset the current time state
        setIsPlaying(false);
        setCurrentTrackData(null);
        setShouldInitPlay(false);
        setQueuePointer(-1);
        setTrackCoverUrl('null');
        setPlayQueue([]);
        setPlayingTrack('');
        FFTcurrentTrack.current = '';

        console.log('No more songs in the queue');
        clearInterval(trackBlendIntervalRef.current);
        clearTimeout(trackBlendTimeoutRef.current);
        resetTransition();
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
    const fetchFFTUserSettings = () => {
        fetch(`${apiBase}/config/user/FFT`, {
            method : "GET",
            credentials: "include"
        }).then(res => res.json())
        .then(data => {FFTUserSetingsRef.current = data;})
    }
    useEffect(() => {
        setVolume(parseFloat(localStorage.getItem('volume')) || 0.5);
        setupAudioGraph();
        if(location.pathname === "/full-screen"){
            locationBeforeFullScreen.current = "";
            fullScreenMode.current = true;
        }
        // In case mounts after logged in or already auto logged in;
        fetchFFTUserSettings();
        // In case mounts before login;
        const unsubscribeOnLogin = subscribe("login", fetchFFTUserSettings);
        return () => {
            destructAudioGraph();
            unsubscribeOnLogin();
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
    const applyArtistChanges = (artistChanges, file = null) =>{
        if(!artistChanges) { //no changes made
            console.log('No changes made');
            setEditingArtist(null);
            return;
        }
        const data = new FormData();
        data.append(`artist`, JSON.stringify(artistChanges));
        //for uploading a new cover we need an object album.uuid, album.ext
        if(file) {
            data.append('coverArtist', file);
        }
        fetch(`${apiBase}/read-write/editContainer/artist`, 
            {method: 'POST',
            credentials: 'include',
            body: data})
        .then(()=> {
            setEditingArtist(null); 
            albumAskRefreshRef.current();    
        })
    };

    const editArtist = (artistId) => {
        fetch(`${apiBase}/read-write/artist/${artistId}/true`, {
            method: 'GET', credentials: 'include'})
        .then(res=> res.json())
        .then((data) => {
            setEditingArtist({
                id: data.id,
                picture: `${apiBase}/covers/artists/${data.picture}`,
                name: data.name,
                bio: data.bio,
                active_from :  data.active_from
            });
        });
        return;
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

    const deleteAlbum = async (forMe, album) => {
        const deletionParams = forMe ? "/forMe" : "";
        const res = await fetch(`${apiBase}/read-write/delete/album/${album.id}${deletionParams}`,
            {
                method : "DELETE",
                credentials : "include"
            }
        )
        .then(res=>res.json());
        if(res.success){
            addNotification(`Album ${album.name} deleted.`, notifTypes.SUCCESS);
            setEditingAlbum(null);
            navigate("/home");
        }
        
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


    const playRadio = (URL) => {
        setQueuePointer(0);
        setPlayQueue([URL]);
        setShouldInitPlay(true);
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

    const linkNewContainer = (newContainer, refreshCallback) => {
        albumAskRefreshRef.current = refreshCallback;
        setContainer(newContainer);
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
    const toggleFullScreenView = () =>{
        fullScreenMode.current = !fullScreenMode.current;
        if(fullScreenMode.current){
            locationBeforeFullScreen.current = location.pathname;
        }
        console.log(locationBeforeFullScreen.current);
        navigate(fullScreenMode.current ? "/full-screen" : 
            (locationBeforeFullScreen.current 
            && locationBeforeFullScreen.current !== "/full-screen" ?
             locationBeforeFullScreen.current : "/home" ));
    }
    const requestNewFullScreenImage = () => {
        return new Promise((resolve) => {
            fetch(`${apiBase}/read-write/getSongMetaDataCover/${playingTrack}`, 
            {
                method : "GET",
                credentials : "include"
            }).then(res => res.blob())
            .then(blob => {
                fullScreenImage.current = {track : playingTrack, blob : blob};
                
                resolve({track : playingTrack, blob : blob});
            });
        });
            
    }

    const skipAudioSeconds = (forward) => {
        if(globalAudioRef.current){
            globalAudioRef.current.currentTime += (forward ? 1 : -1 ) * 10;
        }
    }

    const navigateBack = () => {
        const { history: histArray, pointer } = history;
        if (histArray.every(entry => entry === null)) {
            navigate("/home");
            return;
        }

        // Step back from the current pointer
        let backIndex = (pointer - 2 + histArray.length) % histArray.length;
        let destination = histArray[backIndex];

        // Skip invalid entries
        let attempts = 0;
        while ((!destination || destination === "/full-screen") && attempts < histArray.length
                || destination === location.pathname) {
            backIndex = (backIndex - 1 + histArray.length) % histArray.length;
            destination = histArray[backIndex];
            attempts++;
        }
        history.pointer = backIndex;
        navigate(destination || "/home");

    }

    const toggleCurrentRadioToFavorites = () => {
        if(currentTrackData?.type === "radio"){
            fetch(`${apiBase}/radio/addToFavs/${currentTrackData.uuid}`,{method : "POST", 
                credentials : "include"})
            .then(async res => {
                const json = await res.json();
                 return {json , ok: res.ok}})
            .then(data=>{
                addNotification(data.json.message, notifTypes.INFO);
                console.log(data);
                if(!data.ok) return;
                emit("refetch-known-radios");
            }).catch(err => {
                addNotification("An error occured, you may check server logs." + err.code, notifTypes.ERROR);
            });
        }
    }

    const recomputeColors = (imgRef, safeComputedCallback) => {
        //Avoid useless recompute on reload;

        if(paletteRef.current?.track === playingTrack && paletteRef.current?.pairs.length > 0){
            safeComputedCallback();
            return;
        }
        let colorThief = new ColorThief();
        const palette = colorThief.getPalette(imgRef.current, 10);
        generateContrastedPairs(palette);
        console.log("recomputed");
        console.log(paletteRef.current);
        safeComputedCallback();
    }

    const generateContrastedPairs = (palette) => {
        const pairs = [];
        for (let i = 0; i < palette.length; i++) {
          for (let j = i + 1; j < palette.length; j++) {
            pairs.push({    
                c1:palette[i], c2:palette[j],
                contrast : contrastRatio(palette[i], palette[j])});
          }
        }
        paletteRef.current = {track: playingTrack, pairs: pairs.sort((a,b) => a.contrast - b.contrast)}; 
      };

    return (
        <AudioPlayerContext.Provider 
        value={{
            recomputeColors,
            songPalette : paletteRef,
            skipAudioSeconds,
            toggleCurrentRadioToFavorites,
            externalRadioInfos,
            playRadio,
            navigateBack,
            history,
            colorOverride,
            requestNewFullScreenImage,
            fullScreenImage : fullScreenImage.current,
            toggleFullScreenView,
            fetchFFTUserSettings,
            FFTUserSetingsRef,
            fftConfigRef,
            getFFTAtCurrentTime,
            deleteAlbum,
            editArtist,
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
            globalAudioRef,
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
            {(editingArtist) && <EditArtistInfos applyChanges={applyArtistChanges} artist={editingArtist}/>}

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