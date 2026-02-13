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

    const syncedLyricsRef = useRef(null);
    const lastTime = useRef(0);
    const lyricsScopeRef = useRef(0);
    const currentLyricsRef = useRef(null);
    const nextLyricsRef = useRef(null);
    const previousLyricsRef = useRef(null);
    const timeOffsetRef = useRef(0);
    const animRef = useRef(null);
    const [currentLine, setCurrentLine] = useState(null);
    useEffect(()=>{
        if(!(currentTrackData?.lyrics && syncedLyricsRef.current)) {clearLyrics(); return}
        // syncedLyricsRef.current = processLyricsTimestamps(currentTrackData.lyrics);
        setCurrentLine({previous : [], 
            current: "",
            next:syncedLyricsRef.current.slice(0,1).map(entry => entry.lyric)});
        animRef.current = requestAnimationFrame(update);
    },[currentTrackData?.lyrics]);
    const remapLyricsOnSeek = (t) =>{
        // searchFuture = lastTime.current < t;
        syncingSeekRef.current = true;
        const next = syncedLyricsRef.current.findIndex(el => el.time > t);
        setCurrentLine({previous : syncedLyricsRef.current[next-2]?.lyrics, 
            current: syncedLyricsRef.current[next-1]?.lyric,
            next:syncedLyricsRef.current.slice(next,next+2)?.map(entry => entry.lyric)});
        lastTime.current = t;
        lyricsScopeRef.current = next;
    };

    useEffect(() => { 

        if(!currentTrackData?.lyrics) return;
        const unsubscribe = subscribe("on-seek-song", remapLyricsOnSeek);
        syncedLyricsRef.current = processLyricsTimestamps(currentTrackData.lyrics);
        remapLyricsOnSeek(currentTimeRef.current);
        animRef.current = requestAnimationFrame(update);
        return () => {unsubscribe(); cancelAnimationFrame(animRef.current);};   
    }, [])

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
            clearLyrics(); 
            // animRef.current = requestAnimationFrame(update);
            return}
        // if(!lyricsScopeRef.current) return
        //Skip next resolution if already counted by the remap lyrics
        if(syncingSeekRef.current){
            syncingSeekRef.current = false; 
            animRef.current = requestAnimationFrame(update);
            return;}

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
        if((deltaToNextLyric <= 0.3) && (deltaToNextLyric > 0)){
            slideUp();
        }

        lastTime.current = now;
        animRef.current = requestAnimationFrame(update);
    };
    const slideUp = () => {
        currentLyricsRef.current.setAttribute("data-anim","fade-small");
        nextLyricsRef.current.setAttribute("data-anim","fade-big");
        previousLyricsRef.current.setAttribute("data-anim","fade-out");
    }
    const resetSlide = () => {
        currentLyricsRef.current.removeAttribute("data-anim");
        nextLyricsRef.current.removeAttribute("data-anim");
        previousLyricsRef.current.removeAttribute("data-anim");
    }

    const clearLyrics = () => {
        setCurrentLine(null);
        cancelAnimationFrame(update);};

    return (
        <div id="track-lyrics-div">
            <span ref={previousLyricsRef} className="off-lyrics">{currentLine?.previous}</span>
            <span ref={currentLyricsRef} className="in-lyrics" data-text={currentLine?.current}>{currentLine?.current}</span>
            <span ref={nextLyricsRef} className="off-lyrics">{currentLine?.next[0]}</span>
            <span className="off-lyrics">{currentLine?.next[1]}</span>

        </div>
    )
}

export default TrackLyrics;