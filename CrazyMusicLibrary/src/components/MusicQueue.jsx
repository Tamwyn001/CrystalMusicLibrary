import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from '../GlobalAudioProvider';
import './MusicQueue.css';
import MusicQueueEntry from './MusicQueueEntry';
import { IconTrash } from '@tabler/icons-react';
import { FixedSizeList as List } from 'react-window';


const TrackCacheContext = createContext();


const MusicQueue = ({hideComponent}) => {
    const { playQueue, deleteQueue } = useAudioPlayer();
    const wrapperRef = useRef(null);
    const [cache, setCache] = useState(new Map());

    const getTrack = useCallback((trackId) => cache.get(trackId), [cache]); 
    const setTrack = useCallback((trackId, trackData) => {
        setCache((prevCache) => new Map(prevCache).set(trackId, trackData));
    }, []);

    useEffect(() => {
        const handleClickedOutside = (e) =>{            
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                if(e.target.closest('svg')?.id === 'playlist-button' ){return;}
                hideComponent();
            }}

        document.addEventListener("mousedown", handleClickedOutside);
        document.addEventListener("touchstart", handleClickedOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickedOutside);
            document.removeEventListener("touchstart", handleClickedOutside);
        }
    },[]);
    const itemHeight = 60; // Height of each item in pixels
    const height = 600; // Height of the list in pixels
    return (
        <div className="music-queue" ref={wrapperRef}>
            <TrackCacheContext.Provider value={{ getTrack, setTrack }}>
            <div className="queue-header">
                <h2>Music Queue</h2> 
                {playQueue.length > 0 && <IconTrash className="buttonRound" onClick={deleteQueue} style={{position: 'absolute',  right: '25px'}}/>}
            </div>
            {playQueue.length > 0 ?                     
                    <List
                        height={height}
                        itemCount={playQueue.length}
                        itemSize={itemHeight}
                        width={'100%'}
                        >
                        {({ index, style }) => (
                            <MusicQueueEntry style={style} index={index} key={playQueue[index]} trackId={playQueue[index]} /> 
                        )}
                        </List>
                    :
                <p>No items in the queue</p>}
            </TrackCacheContext.Provider>
        </div>
    )
}

export default MusicQueue;
export const useTrackCache = () => useContext(TrackCacheContext);