import { useEffect, useState } from "react";
import apiBase from "../../APIbase";

import GenreCard from "../components/GenreCard";

const GenresView = ({}) => {
    const [genres, setGenres] = useState([]);
    useEffect(() =>{
        fetch(`${apiBase}/read-write/genres`, {
            method: "GET",
            credentials: "include"
        }).then(res => res.json())
        .then(data =>{
            setGenres(data);
        })}
    ,[]);

    return( 
        <div className="home genre-displayer">
            {genres.map((genre) => (
            <GenreCard key={genre.id} genre={genre}/>
        ))}
        </div>
    )
}

export default GenresView;