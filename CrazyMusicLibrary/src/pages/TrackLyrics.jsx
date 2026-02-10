import { useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "../GlobalAudioProvider";
const processLyricsTimestamps = (lyrics) => {
    const regex = /\[(\d{2}):(\d{2}\.\d{2})\]\s*(.+)/g;

    return [...lyrics.matchAll(regex)].map(m => ({
    time: Number(m[1]) * 60 + Number(m[2]),
    lyric: m[3]
    }));
}
const TrackLyrics = () => {
    const {currentTrackData, currentTime} = useAudioPlayer();
    const syncedLyricsRef = useRef(null);
    const lastTime = useRef(0);
    const lyricsScopeRef = useRef(0);

    const [currentLine, setCurrentLine] = useState(null);
    useEffect(()=>{
        if(!currentTrackData.lyrics) return
        syncedLyricsRef.current = processLyricsTimestamps(currentTrackData.lyrics);
        setCurrentLine({previous : [], 
            current: "",
            next:syncedLyricsRef.current.slice(0,2).map(entry => entry.lyric)});

    },[currentTrackData.lyrics]);

    useEffect(()=>{
        if(!currentTrackData.lyrics) return
        // if(!lyricsScopeRef.current) return
        const lyricsScope = lyricsScopeRef.current;
        if(currentTime >= syncedLyricsRef.current[lyricsScope].time){
            setCurrentLine({previous : currentLine ? [currentLine.current,...currentLine.previous].slice(0,2) : [], 
                current: syncedLyricsRef.current[lyricsScope].lyric,
                next:syncedLyricsRef.current
                    .slice(lyricsScope+1,lyricsScope+3)
                    .map(entry => entry.lyric)});
            lyricsScopeRef.current = lyricsScope + 1;
        }
        lastTime.current = currentTime;
    },[currentTime]);

    
    return (
        <div id="track-lyrics-div">
            {currentLine?.previous.map( text => <span className="off-lyrics">{text}</span>)}
            <span className="in-lyrics">{currentLine?.current}</span>
             {currentLine?.next.map( text => <span className="off-lyrics">{text}</span>)}
        </div>
    )
}

export default TrackLyrics;