import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import TrackView from "../components/TrackView";
import { useParams } from "react-router-dom";
import {IconArrowBackUp, IconArrowsShuffle, IconCodePlus} from "@tabler/icons-react";
import "./AlbumView.css";

import apiBase from "../../APIbase";
import CML_logo from "../components/CML_logo";
import ButtonWithCallback from "../components/ButtonWithCallback";
import { useAudioPlayer } from "../GlobalAudioProvider";
const AlbumView = () => {
    //the actual album data
    const [album, setAlbum] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [currentPlayIcon, setCurrentPlayIcon] = useState(0);
    //the id for the REST API is the albumId in the URL
    const { addAlbumToQueue, playSuffle } = useAudioPlayer();
    const albumId = useParams().albumId;
    useEffect(() => {
        fetch(`${apiBase}/read-write/album/${albumId}`, {
            method: "GET",
            credentials: "include"
        })
        .then(res => {
            if (!res.ok) {throw new Error("Network response was not ok");}
            return res.json();
        })
        .then(data => {setAlbum(data.albumInfos); setTracks(data.tracks);
            console.log(data.albumInfos);
            setCurrentPlayIcon(Math.floor(Math.random() * 3));
        })
        
    }, [albumId]);
    const handleAddToQueue = async () => {
        const res = await addAlbumToQueue(albumId);
        return res;
    }
    const handleShuffle = async () => {
        playSuffle(albumId, false);
    }
    return (
        <div className="album-view">
            <button className="roundButton" onClick={() => window.history.back()}>
                <IconArrowBackUp />
            </button>
            {(album && tracks) ? (
                <div className="album-details">
                    <h1>{album.title}</h1>
                    <h2>{album.artist}</h2>
                    {/* <p>{albumId}</p> */}
                    <div className="album-content">
                        {(album.cover)?
                        <img src={`${apiBase}/covers/${album.cover}`} alt={`${album.title} cover`} className="cover-image" />
                        : <CML_logo className="cover-image" />}
                        <div className="track-list">
                            <div className="track-list-header">
                                <ButtonWithCallback text={'Add to queue'} icon={<IconCodePlus/>} onClick={handleAddToQueue}/>
                                <ButtonWithCallback text={'Random'} icon={<IconArrowsShuffle />} onClick={handleShuffle}/>

                            </div>
                            {tracks.map((track, index) => (<TrackView key={track.path} index={index} track={track} containerId={albumId}
                             isPlaylistView={false} playIconId={currentPlayIcon} />))}
                        </div>
                    </div>
                </div>
            ): (<Loading text={"Loading album"}/>)}
        </div>
    )
}

export default AlbumView;