import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import TrackView from "../components/TrackView";
import { useParams } from "react-router-dom";
import {IconArrowBackUp, IconArrowsShuffle, IconCodePlus} from "@tabler/icons-react";
import "./albumView.css";

import apiBase from "../../APIbase";
import CML_logo from "../components/CML_logo";
import ButtonWithCallback from "../components/ButtonWithCallback";
import { useAudioPlayer } from "../GlobalAudioProvider";
import LibAlbumCard from "../components/LibAlbumCard";
const artistView = () => {
    //the actual artist data
    const [artist, setArtist] = useState(null);
    const [albums, setAlbums] = useState([]);
    //the id for the REST API is the artistId in the URL
    const { addArtistToQueue, shuffleArtistToQueue } = useAudioPlayer();
    const artistId = useParams().artistId;
    useEffect(() => {

        fetch(`${apiBase}/read-write/artist/${artistId}`, {
            method: "GET",
            credentials: "include"
        })
        .then(res => {
            if (!res.ok) {throw new Error("Network response was not ok");}
            return res.json();
        })
        .then(data => {setArtist(data.artistInfos); setAlbums(data.albums);
            console.log(data.artistInfos);
        })
        
    }, [artistId]);

    const handleAddToQueue = async () => {
        const res = await addArtistToQueue(artistId);
        return res;
    }
    const handleShuffle = async () => {
        shuffleArtistToQueue(artistId, false);
    }
    return (
        <div className="album-view">
            <button className="roundButton" onClick={() => window.history.back()}>
                <IconArrowBackUp />
            </button>
            {(artist && albums) ? (
                <div className="album-details">
                    <h1>{artist.name}</h1>
                    <div className="album-content">
                        {(artist.picture)?
                        <img src={`${apiBase}/covers/${artist.picture}`} alt={`${artist.name} cover`} className="cover-image" />
                        : <CML_logo className="cover-image" />}
                        <div className="track-list">
                            <div className="track-list-header">
                                <ButtonWithCallback text={'Add to queue'} icon={<IconCodePlus/>} onClick={handleAddToQueue}/>
                                <ButtonWithCallback text={'Random'} icon={<IconArrowsShuffle />} onClick={handleShuffle}/>

                            </div>
                            <div className="album-displayer">
                               {albums.map((album) => (<LibAlbumCard key={album.id} album={album} hideArtist={true}/>))}
                            </div>
                        </div>
                    </div>
                </div>
            ): (<Loading text={"Loading artist"}/>)}
        </div>
    )
}

export default artistView;