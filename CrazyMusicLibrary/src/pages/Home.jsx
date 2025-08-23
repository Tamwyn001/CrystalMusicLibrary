
import LibAlbumCard from "../components/LibAlbumCard.jsx";
import { useEffect, useState } from "react";
import apiBase from "../../APIbase.js";
import { AddMusicShortcut } from "../components/AddMusicShortcut.jsx";
import { asVerified } from "../../lib.js";
import { useEventContext } from "../GlobalEventProvider.jsx";
const Home = ({}) => {
    const [albums, setAlbums] = useState([]);
    const [albumFetched, setAlbumFetched] = useState(false);
    const {subscribe } = useEventContext();
    const fetchAlbums = () => {
        fetch(`${apiBase}/read-write/albums`, {method: "GET", credentials: "include"})
        .then((response) => {
            if(response.status !== 200){
                console.error("Error fetching albums");
                return;
            }
            return response.json();
        }).then((data) => {
            setAlbums(data);
            setAlbumFetched(true)});
    }
    useEffect(() => {
        const verify = asVerified( () => {
            fetchAlbums(); // Trigger when Home is mounted
        });
        verify();
        
          const unsubscribeMusicUploaded = subscribe("musicUploaded", fetchAlbums);
          return () => {
            unsubscribeMusicUploaded();
          }
    }, []); // Empty dependency array = only on mount

    const SkeletonLoader = () => {
        return (
        <div className="album-card-loader loader-div">
            <div className="album-card-loader loader-img"></div>
            <div className="album-card-loader loader-text title"></div>
            <div className="album-card-loader loader-text "></div>
        </div>)
    } 

    return(
        <div className="home album-displayer" data-no-tracks={(albums?.length == 0 && albumFetched) ? "true" : "false"}>
           {!albumFetched?  
           <SkeletonLoader/>
           : (albums?.length !== 0 ? albums.map((album) => (
            <LibAlbumCard key={album.id} album={album}/>
        )) : <AddMusicShortcut/>)}
        </div>
    )
}
export default Home;
