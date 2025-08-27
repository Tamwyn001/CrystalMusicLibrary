import {  memo, useEffect, useState } from "react";

import CML_logo from "./CML_logo.jsx";
import apiBase from "../../APIbase.js";


/**
 * This queue row memo render everytime the linked song changes.
 * An internal useEffect takes care of rerendering when the song  
 * cover is fetched. It uses a shared cache to avoid refetching 
 * the cover.
 */
const MusicQueueEntry = memo(
    ({ index, style, data }) => {
        const { playQueue, cacheRef, jumpToQueueTrack, queuePointer } = data;
        const trackId = playQueue[index];
        const [loaded, setLoaded] = useState(!!cacheRef.current[trackId]);
        let trackInfo = cacheRef.current[trackId];
        if (!trackInfo) {
            // lazy fetch when needed
            trackInfo = { title: "Loading...", cover: "loading" };
        }
        useEffect(() => {
            if(!loaded){
                cacheRef.current[trackId] = trackInfo;
                fetch(`${apiBase}/read-write/shortTrackInfos/${trackId}`, {
                credentials: "include"
                })
                .then(res => res.json())
                .then(data => {
                    cacheRef.current[trackId] = data;
                    setLoaded(true); // triggers re-render with loaded = true
                });
            }
        }, [loaded, trackId]);
        // Apply style modification
        const rowStyle = { ...style, width: "calc(100% - 15px)", height: "47.5px" };

        return (
          <div
            className="music-queue-entry"
            style={rowStyle}
            is-passed={`${index < queuePointer}`}
            is-selected={`${index === queuePointer}`}
            onClick={() => jumpToQueueTrack(index)}
          >
            {trackInfo.cover ? (
              <img src={`${apiBase}/covers/${trackInfo.cover}`} className="track-image-small" />
            ) : (
              <CML_logo className="track-image-small" />
            )}
            <span className="track-title">{trackInfo.title}</span>
          </div>
        );
      }, (prev,next) => 
            prev.data.playQueue[prev.data.queuePointer] 
            === next.data.playQueue[next.data.queuePointer]
    );

export default MusicQueueEntry;