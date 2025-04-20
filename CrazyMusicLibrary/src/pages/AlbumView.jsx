import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import TrackView from "../components/TrackView";
import { useParams } from "react-router-dom";
import {IconArrowBackUp} from "@tabler/icons-react";
import "./AlbumView.css";

import logo from "../assets/CML_logo.svg";
const AlbumView = () => {
    //the actual album data
    const [album, setAlbum] = useState(null);
    const [tracks, setTracks] = useState([]);
    //the id for the REST API is the albumId in the URL
    const albumId = useParams().albumId;
    useEffect(() => {
        fetch(`http://localhost:4590/read-write/album/${albumId}`, {
            method: "GET",
            credentials: "include"
        })
        .then(res => {
            if (!res.ok) {throw new Error("Network response was not ok");}
            return res.json();
        })
        .then(data => {setAlbum(data.albumInfos); setTracks(data.tracks);
            console.log(data.albumInfos);
        })
    }, [albumId]);

    return (
        <div className="album-view">
            <button className="roundButton" onClick={() => window.history.back()}>
                <IconArrowBackUp />
            </button>
            {(album && tracks) ? (
                <div className="album-details">
                    <h1>{album.title}</h1>
                    <h2>{album.artist}</h2>
                    <div className="album-content">
                        <img src={album.coverImage? album.coverImage : logo} alt={`${album.title} cover`} className="cover-image" />
                        <div className="track-list">
                            {tracks.map(track => (<TrackView key={track.id} track={track} />))}
                        </div>
                    </div>
                </div>
            ): (<Loading text={"Loading album"}/>)}
        </div>
    )
}

export default AlbumView;