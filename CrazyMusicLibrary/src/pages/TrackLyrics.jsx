import { useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "../GlobalAudioProvider";
import { useEventContext } from "../GlobalEventProvider.jsx";

const processLyricsTimestamps = (lyrics) => {
    const regex = /^\[(\d{1,2}):(\d{1,2}\.\d{1,2})\][ \t]*(.*)$/gm;

    return [...lyrics.matchAll(regex)].map(m => ({
    time: Number(m[1]) * 60 + Number(m[2]),
    lyric: m[3]
    }));
}
const TrackLyrics = () => {
    const {currentTrackData, currentTimeRef} = useAudioPlayer();
    const {subscribe} = useEventContext();
    const syncingSeekRef = useRef(false);
    const currentLyricsDivRef = useRef(null);
    const syncedLyricsRef = useRef(null);
    const lyricsScopeRef = useRef(0);
    const currentLyricsRef = useRef(null);
    const nextLyricsRef = useRef(null);
    const previousLyricsRef = useRef(null);
    const timeOffsetRef = useRef(0);
    const animRef = useRef(null);
    const clearTextIntervalRef = useRef(-1);
    const currentlySlidingRef = useRef(false);
    const scheduleNextTimeoutRef = useRef(-1);
    const [currentLine, setCurrentLine] = useState(null);
    useEffect(()=>{
        if(!(currentTrackData?.lyrics)) {clearLyrics(); return;}
        syncedLyricsRef.current = processLyricsTimestamps(currentTrackData.lyrics);
        remapLyricsOnSeek(currentTimeRef.current);

        // setCurrentLine({previous : [], 
        //     current: "",
        //     next:syncedLyricsRef.current.slice(0,1).map(entry => entry.lyric)});
        cancelAnimationFrame(animRef.current)
        animRef.current = requestAnimationFrame(update);

    },[currentTrackData]);

    const remapLyricsOnSeek = (t) =>{
        clearTimeout(scheduleNextTimeoutRef.current);
        scheduleNextTimeoutRef.current =  -1;
        if(!(syncedLyricsRef.current) && currentTrackData.lyrics) {
            syncedLyricsRef.current = processLyricsTimestamps(currentTrackData.lyrics);
            cancelAnimationFrame(animRef.current);
            animRef.current = requestAnimationFrame(update);
            return
        }else if (!(syncedLyricsRef.current))return;

        syncingSeekRef.current = true;
        const next = syncedLyricsRef.current.findIndex(el => el.time > t);
        setCurrentLine({previous : syncedLyricsRef.current[next-2]?.lyrics, 
            current: syncedLyricsRef.current[next-1]?.lyric,
            next:syncedLyricsRef.current.slice(next,next+2)?.map(entry => entry.lyric)});
        lyricsScopeRef.current = next;

        cancelAnimationFrame(animRef.current);
        animRef.current = requestAnimationFrame(update);
        console.log("Req on seek");
    };

    useEffect(() => { 

        if(!currentTrackData?.lyrics) return;
        const unsubscribe = subscribe("on-seek-song", remapLyricsOnSeek);
        const unsubscribePause = subscribe("isPlayingTrack",onTogglePlay)
        syncedLyricsRef.current = processLyricsTimestamps(currentTrackData.lyrics);
        remapLyricsOnSeek(currentTimeRef.current);
        cancelAnimationFrame(animRef.current)
        animRef.current = requestAnimationFrame(update);
        return () => {unsubscribe(); unsubscribePause(); cancelAnimationFrame(animRef.current);};   
    }, [])

    const onTogglePlay = (isPlaying) => {
        if(isPlaying){
            cancelAnimationFrame(animRef.current)
            animRef.current = requestAnimationFrame(update);
            return;
        }
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
        clearTimeout(scheduleNextTimeoutRef.current);
        scheduleNextTimeoutRef.current = -1; 
    }
    const update = (time) => {
        if(!(currentLyricsRef.current &&
        nextLyricsRef.current &&
        previousLyricsRef.current)){
            cancelAnimationFrame(animRef.current);
            return
        }
        let now = time/1000 - timeOffsetRef.current;

        if(Math.abs(now - currentTimeRef.current) > 0.3) {
            timeOffsetRef.current = time/1000 - currentTimeRef.current;
            // console.log("remped time", timeOffsetRef.current);
            now = time/1000 - timeOffsetRef.current;
        }  
        const lyricsScope = lyricsScopeRef.current;
        if(!(currentTrackData?.lyrics && syncedLyricsRef.current[lyricsScope]?.time)) 
        {
            setCurrentLine(null);    
                    // animRef.current = requestAnimationFrame(update);
            return}
        // if(!lyricsScopeRef.current) return
        //Skip next resolution if already counted by the remap lyrics
        // if(syncingSeekRef.current){
        //     syncingSeekRef.current = false; 
        //     cancelAnimationFrame(animRef.current)
        //     animRef.current = requestAnimationFrame(update);
        //     return;}
        if (syncedLyricsRef.current[lyricsScopeRef.current]?.time - now > 1){
            cancelAnimationFrame(animRef.current);
            scheduleNextTimeoutRef.current = setTimeout(()=>{
                animRef.current = requestAnimationFrame(update);
            }, (syncedLyricsRef.current[lyricsScopeRef.current]?.time - now - 0.7)*1000);
            return;
        }
        if(now >= syncedLyricsRef.current[lyricsScope]?.time){
            setCurrentLine({previous : syncedLyricsRef.current[lyricsScope-1]?.lyric, 
                current: syncedLyricsRef.current[lyricsScope].lyric,
                next:syncedLyricsRef.current
                    .slice(lyricsScope+1,lyricsScope+2)
                    .map(entry => entry.lyric)});
            lyricsScopeRef.current = lyricsScope + 1;
            resetSlide();
            
        }
        // console.log(syncedLyricsRef.current[lyricsScope]?.time - now);
        const deltaToNextLyric = syncedLyricsRef.current[lyricsScope]?.time - now
        if((deltaToNextLyric <= 0.29) && (deltaToNextLyric > 0) && !(currentlySlidingRef.current)){
            slideUp();
        }        
        cancelAnimationFrame(animRef.current);
        animRef.current = requestAnimationFrame(update);

    };
    const slideUp = () => {
        currentlySlidingRef.current = true;
        currentLyricsRef.current.setAttribute("data-anim","fade-small");
        nextLyricsRef.current.setAttribute("data-anim","fade-big");
        previousLyricsRef.current.setAttribute("data-anim","fade-out");
        // const el = currentLyricsDivRef.current;
        // void el.offsetWidth;                     // force reflow
        currentLyricsDivRef.current.classList = "data-fade-text-out";
        clearTextIntervalRef.current = setTimeout(()=>{
            currentlySlidingRef.current = false;
            currentLyricsDivRef.current.classList = "data-fade-text-in";
        },300);

    }
    const resetSlide = () => {
        currentLyricsRef.current.removeAttribute("data-anim");
        
        setTimeout ( ()=>{nextLyricsRef.current.removeAttribute("data-anim");previousLyricsRef.current.removeAttribute("data-anim")},100);
    }

    const clearLyrics = () => {
        setCurrentLine(null);
        cancelAnimationFrame(animRef.current);
        syncedLyricsRef.current = null;
    };
    if (!syncedLyricsRef.current) return <></>;
    return (
        <div id="track-lyrics-div"> 
            <span ref={previousLyricsRef} className="off-lyrics">{currentLine?.previous}</span>
            <div id="in-lyrics-div" ref={currentLyricsDivRef}>
                <span ref={currentLyricsRef} className="in-lyrics" data-text={currentLine?.current}>{currentLine?.current}</span>
            </div>
            <span ref={nextLyricsRef} className="off-lyrics">{currentLine?.next[0]}</span>
            <span className="off-lyrics">{currentLine?.next[1]}</span>
        </div>
        
    )
}

export default TrackLyrics;