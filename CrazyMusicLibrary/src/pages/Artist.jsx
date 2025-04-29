import { useEffect, useState } from "react";
import LibArtistsCard from "../components/LibArtistsCard";
import apiBase from "../../APIbase";

const Artist = () => {
    const [artists, setArtists] = useState([]);
    const fetchArtists = () => {
        fetch(`${apiBase}/read-write/artists`, {method: "GET", credentials: "include"})
        .then((response) => {
            if(response.status !== 200){
                console.error("Error fetching artists");
                return;
            }
            return response.json();
        }).then((data) => {setArtists(data)});
    }
    useEffect(() => {
        fetchArtists(); // Trigger when Home is mounted
    }, []); // Empty dependency array = only on mount


    return(
        <div className="home album-displayer">
           {artists?.map((artist) => (
            <LibArtistsCard key={artist.id} artist={artist}/>
        ))}
        </div>
    )
}
export default Artist;