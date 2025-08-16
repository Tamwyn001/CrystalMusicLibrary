import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import TrackView from "../components/TrackView";
import { useParams } from "react-router-dom";
import {IconArrowBackUp, IconArrowsShuffle, IconCodePlus, IconEdit} from "@tabler/icons-react";
import "./AlbumView.css";

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
    const { addArtistToQueue, shuffleArtistToQueue, editArtist, linkNewContainer,navigateBack } = useAudioPlayer();
    const artistId = useParams().artistId;
    useEffect(() => {
        updateArtist();
        linkNewContainer({id: artistId, type : "artist"}, updateArtist)  
    }, [artistId]);

    const updateArtist = () => {
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
        });
    }
    const handleAddToQueue = async () => {
        const res = await addArtistToQueue(artistId);
        return res;
    }
    const handleShuffle = async () => {
        shuffleArtistToQueue(artistId, false);
    }
    return (
        <div className="album-view">
            <button className="roundButton" onClick={navigateBack}>
                <IconArrowBackUp />
            </button>
            {(artist && albums) ? (
                <div className="album-details">
                    <h1>{artist.name}</h1>
                    <div className="album-content">
                        {(artist.picture)?
                        <img src={`${apiBase}/covers/artists/${artist.picture}`} alt={`${artist.name} cover`} className="cover-image" />
                        : <CML_logo className="cover-image" />}
                        <div className="track-list">
                            <div className="track-list-header">
                                <ButtonWithCallback text={'Add to queue'} icon={<IconCodePlus/>} onClick={handleAddToQueue}/>
                                <ButtonWithCallback text={'Random'} icon={<IconArrowsShuffle />} onClick={handleShuffle}/>
                                <ButtonWithCallback icon={<IconEdit/>} onClick={async () => { editArtist(artist.id)}}/>
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