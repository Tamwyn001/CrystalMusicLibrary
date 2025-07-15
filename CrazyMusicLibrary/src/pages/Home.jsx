import ProgressBar from "../components/ProgressBar";
import LibAlbumCard from "../components/LibAlbumCard";
import { useEffect, useState } from "react";
import apiBase from "../../APIbase";
import { IconSquarePlus } from "@tabler/icons-react";
import { AddMusicShortcut } from "../components/AddMusicShortcut";
const Home = ({}) => {
    const [albums, setAlbums] = useState([]);
    const [albumFetched, setAlbumFetched] = useState(false);
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
        fetchAlbums(); // Trigger when Home is mounted
        const handleMusicUploaded = (e) => {
            console.log("Music uploaded:", e.detail);
            fetchAlbums(); // your data reload function
          };
        
          window.addEventListener("musicUploaded", handleMusicUploaded);
          return () => {
            window.removeEventListener("musicUploaded", handleMusicUploaded);
          };
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
