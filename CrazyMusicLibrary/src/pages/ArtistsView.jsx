import { useEffect, useState } from "react";
import LibArtistsCard from "../components/LibArtistsCard.jsx";
import apiBase from "../../APIbase.js";
import { AddMusicShortcut } from "../components/AddMusicShortcut.jsx";
import { asVerified } from "../../lib.js";
import { useEventContext } from "../GlobalEventProvider.jsx";

const ArtistsView = () => {
    const [artists, setArtists] = useState([]);
    const {subscribe} = useEventContext();
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
        const verify = asVerified(()=>{
            fetchArtists(); // Trigger when Home is mounted
        });
        verify();
        
        const unsubscribeMusicUploaded = subscribe("musicUploaded", fetchArtists);
        return () => {
            unsubscribeMusicUploaded();
          };
    }, []); // Empty dependency array = only on mount


    return(
        <div className={`home ${ artists?.length !== 0 ? "album-displayer" : ""}`}>
           { artists?.length !== 0 ? artists.map((artist) => (
            <LibArtistsCard key={artist.id} artist={artist}/>
        )) 
        : <AddMusicShortcut/> }
        </div>
    )
}
export default ArtistsView;