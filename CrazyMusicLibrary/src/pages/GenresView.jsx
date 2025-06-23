import { useEffect, useState } from "react";
import apiBase from "../../APIbase";

import GenreCard from "../components/GenreCard";
import { AddMusicShortcut } from "../components/AddMusicShortcut";

const GenresView = ({}) => {
    const [genres, setGenres] = useState([]);

    const refetch = () => {
        fetch(`${apiBase}/read-write/genres`, {
            method: "GET",
            credentials: "include"
        }).then(res => res.json())
        .then(data =>{
            setGenres(data);
        })
    }
    useEffect(() =>{
        refetch();
        const handleMusicUploaded = (e) => {
            console.log("Music uploaded:", e.detail);
            refetch(); // your data reload function
          };
        
          window.addEventListener("musicUploaded", handleMusicUploaded);
          return () => {
            window.removeEventListener("musicUploaded", handleMusicUploaded);
          };
        }
    ,[]);

    return( 
        <div className="home genre-displayer">
            {genres?.length !== 0 ? genres.map((genre) => (
            <GenreCard key={genre.id} genre={genre}/>
        ))
        : <AddMusicShortcut/>}
        </div>
    )
}

export default GenresView;