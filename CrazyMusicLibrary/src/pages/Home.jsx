import ProgressBar from "../components/ProgressBar";
import LibAlbumCard from "../components/LibAlbumCard";
import { useEffect, useState } from "react";
import apiBase from "../../APIbase";
const Home = ({}) => {
    const [albums, setAlbums] = useState([]);
    const fetchAlbums = () => {
        fetch(`${apiBase}/read-write/albums`, {method: "GET", credentials: "include"})
        .then((response) => {
            if(response.status !== 200){
                console.error("Error fetching albums");
                return;
            }
            return response.json();
        }).then((data) => {setAlbums(data)});
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


    return(
        <div className="home album-displayer">
           {albums.map((album) => (
            <LibAlbumCard key={album.id} album={album}/>
        ))}
        </div>
    )
}
export default Home;
