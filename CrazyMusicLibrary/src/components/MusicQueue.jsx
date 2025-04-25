import { useEffect, useRef } from 'react';
import { useAudioPlayer } from '../GlobalAudioProvider';
import './MusicQueue.css';
import MusicQueueEntry from './MusicQueueEntry';
import { IconTrash } from '@tabler/icons-react';
const MusicQueue = ({hideComponent}) => {
    const { playQueue, deleteQueue } = useAudioPlayer();
    const wrapperRef = useRef(null);

    useEffect(() => {
        console.log("Queue pointer: ", playQueue);
    }, [playQueue]);


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
    return (
        <div className="music-queue" ref={wrapperRef}>
            <div className="queue-header">
                <h2>Music Queue</h2> 
                {playQueue.length > 0 && <IconTrash className="buttonRound" onClick={deleteQueue} style={{position: 'absolute',  right: '25px'}}/>}
            </div>
            <div className="queue-content">
                {playQueue.length > 0 ? playQueue.map(((track, index) => { 
                    return <MusicQueueEntry index={index} key={track} trackId={track.split('.')[0]} /> })) :
                <p>No items in the queue</p>}
            </div>
        </div>
    )
}

export default MusicQueue;