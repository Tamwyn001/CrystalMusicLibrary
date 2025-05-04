import { useEffect, useState } from "react";
import LibAlbumCard from "../components/LibAlbumCard";
import { IconArrowBackUp } from "@tabler/icons-react";
import { useParams } from "react-router-dom";
import apiBase from "../../APIbase";

const GenreView = () => {
    const [genre, setGenre] = useState(null);
    const {genreId} = useParams();
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

    return(
        <div className="genre-view">
            <button className="roundButton" onClick={() => window.history.back()}>
                <IconArrowBackUp />
            </button>
            {(genre) ? (
                <div className="genre-details">
                    <h1>{genre.name}</h1>
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