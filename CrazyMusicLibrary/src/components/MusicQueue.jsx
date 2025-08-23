import {useEffect, useRef } from 'react';
import { useAudioPlayer } from '../GlobalAudioProvider.jsx';
import './MusicQueue.css';
import MusicQueueEntry from './MusicQueueEntry.jsx';
import { IconTrash } from '@tabler/icons-react';
import { FixedSizeList as List } from 'react-window';
import { useEventContext } from '../GlobalEventProvider.jsx';



const itemHeight = 50; // Height of each item in pixels
const height = 600; // Height of the list in pixels
// Memoized row that only renders once per index

const MusicQueue = ({hideComponent}) => {
    const { playQueue, deleteQueue, jumpToQueueTrack, queuePointer } = useAudioPlayer();
    const wrapperRef = useRef(null);
    const {subscribe} = useEventContext();
    const cacheRef = useRef(new Map()); // store rendered rows

    useEffect(() => {
        const handleClickedOutside = (e) =>{            
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                if(e.target.closest('svg')?.id === 'playlist-button' ){return;}
                hideComponent();
            }}
        const unsubscribeActionBar = subscribe("action-bar-open", () => {hideComponent()});
        document.addEventListener("mousedown", handleClickedOutside);
        document.addEventListener("touchstart", handleClickedOutside);
        return () => {
            unsubscribeActionBar();
            document.removeEventListener("mousedown", handleClickedOutside);
            document.removeEventListener("touchstart", handleClickedOutside);
        }
    },[]);

    return (
        <div className="music-queue" ref={wrapperRef}>
            <div className="queue-header">
                <h2>Music Queue</h2> 
                {playQueue.length > 0 && <IconTrash className="buttonRound" id="queue-trash" onClick={deleteQueue} />}
            </div>
           
            {playQueue.length > 0 ?  
                <List
                height={height}
                itemCount={playQueue.length}
                itemSize={itemHeight}
                width={'100%'}
                itemData={{ playQueue, cacheRef, jumpToQueueTrack, queuePointer }}
                >
                    {MusicQueueEntry}
                </List>:                                     
                <p>No items in the queue</p>}

        </div>
    )
}

export default MusicQueue;
