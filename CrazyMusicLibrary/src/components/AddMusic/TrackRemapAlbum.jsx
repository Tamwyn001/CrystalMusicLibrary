import { useEffect, useState } from "react";
import { useAddMusicContext } from "../AddMusic";
import './TrackRemapAlbum.css';
const TrackRemapAlbum = ({ track }) => {
    const {albums, moveTrackToNewAlbum, moveTrackToAlbum, editingAlbum, setEditingAlbum} = useAddMusicContext();
    const [newAlbumName, setNewAlbumName] = useState(''); //if valid, we want a new album
    const [lastTrack, setLastTrack] = useState(false); //if true, we are the last track of the album
    const handleTrackRemap = (e) => {
        e.preventDefault();
        if (!newAlbumName){
            moveTrackToAlbum(track, e.target.existingAlbum.value);
        } else {
            moveTrackToNewAlbum(track, newAlbumName);
        }
        if (lastTrack){
            setEditingAlbum(null);
        }
    }
    const inputForNewAlbum = (e) => {
        setNewAlbumName(e.target.value);
    }
    useEffect(() => {
        albums.find(({uuid}) => uuid === editingAlbum).tracks.length === 1 ? setLastTrack(true) : setLastTrack(false);
    },[]);
    return(
        <div className="trackRemapAlbum">
            { lastTrack && <p className="last-track-notify">Last track of the album, if you move it, the current album will be deleted.</p>}
            <form className="trackRemapAlbumForm" onSubmit={handleTrackRemap}>
                <label htmlFor="newAlbum">Album name</label>
                <input type="text" id="newAlbum" placeholder="Enter album name" onChange={inputForNewAlbum} />
                <label htmlFor="existingAlbum">Existing album</label>
                <select id="existingAlbum"  onChange={() => setNewAlbumName('')}>
                   {albums.map((album, index) => ( (album.uuid === editingAlbum) ? null :
                       <option key={index} value={album.uuid}>{album.name}</option>
                   ))}
                    
                </select>
                <input type="submit" value="Submit"/>
            </form>  
        </div>
    )
}

export default TrackRemapAlbum;