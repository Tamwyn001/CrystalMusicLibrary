import { useEffect, useState } from "react";
import LibAlbumCard from "../components/LibAlbumCard";
import { IconArrowBackUp, IconArrowsShuffle, IconCodePlus, IconPlayCard, IconPlayerPlay } from "@tabler/icons-react";
import { useParams } from "react-router-dom";
import apiBase from "../../APIbase";
import ButtonWithCallback from '../components/ButtonWithCallback'
import { useAudioPlayer } from "../GlobalAudioProvider";

const GenreView = () => {
    const [genre, setGenre] = useState(null);
    const {genreId} = useParams();
    const {addContainerToQueue, playContainerSuffle, playContainer} = useAudioPlayer();
    useEffect(() => {
        
        fetch(`${apiBase}/read-write/genre/${genreId}`, {
            method: "GET",
            credentials: "include"
        })
        .then(res => {
            if (!res.ok) {throw new Error("Network response was not ok");}
            return res.json();
        })
        .then(data => {
            setGenre(data);
            console.log(data);
        })
    }, []);

    const handlePlayAll = async () => {
        playContainer(genreId, "genre");
    }
    const handleAddToQueue = async () => {
        addContainerToQueue(genreId, "genre");
    }
    const handleShuffle = async () => {
        playContainerSuffle(genreId, "genre");
    }

    return(
        <div className="genre-view">
            <button className="roundButton" onClick={() => window.history.back()}>
                <IconArrowBackUp />
            </button>
            {(genre) ? (
                <div className="genre-details">
                    <div style={{display : "flex", flexDirection : "row", alignItems : "baseline", gap: "10px"}}>
                        <h1 style={{marginRight : "20px"}}>{genre.name}</h1>
                        <ButtonWithCallback text={'Play'} icon={<IconPlayerPlay/>} onClick={handlePlayAll}/>
                        <ButtonWithCallback text={'Random'} icon={<IconArrowsShuffle />} onClick={handleShuffle}/>
                        <ButtonWithCallback text={'Add to queue'} icon={<IconCodePlus/>} onClick={handleAddToQueue}/>

                    </div>
                    <div className="genre-albums album-displayer">
                        {genre.albums.map((album) => 
                            <LibAlbumCard key={album.id} album={album} />
                        )}
                    </div>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    )
}

export default GenreView;