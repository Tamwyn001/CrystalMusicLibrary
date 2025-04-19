import ProgressBar from "../components/ProgressBar";
import LibAlbumCard from "../components/LibAlbumCard";
import { useEffect, useState } from "react";
const Home = () => {
    const [albums, setAlbums] = useState([]);
    let cards;
    const fetchAlbums = () => {
        fetch("http://localhost:4590/read-write/albums", {method: "GET", credentials: "include"}).then((response) => {
            if(response.status !== 200){
                console.error("Error fetching albums");
                return;
            }
            return response.json();
        }).then((data) => {setAlbums(data)});
    }
    useEffect(() => {
        fetchAlbums(); // Trigger when Home is mounted
    }, []); // Empty dependency array = only on mount


    return(
        <div className="home">
           {albums.map((album) => (
            <LibAlbumCard key={album.id} album={album} />
        ))}
        </div>
    )
}
export default Home;
