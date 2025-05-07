import { useEffect, useRef, useState } from "react";
import { useAddMusicContext } from "../AddMusic";
import './TrackRemapAlbum.css';
const TrackRemapAlbumAddMusic = ({ track, onClose }) => {
    const {albums, moveTrackToNewAlbum, moveTrackToAlbum, editingAlbum, setEditingAlbum} = useAddMusicContext();
    const [newAlbumName, setNewAlbumName] = useState(''); //if valid, we want a new album
    const [lastTrack, setLastTrack] = useState(false); //if true, we are the last track of the album
    const wrapperRef = useRef(null);


    const handleTrackRemap = (e) => {
        e.preventDefault();
        
        if (!newAlbumName && e.target.existingAlbum.value){
            moveTrackToAlbum(track, e.target.existingAlbum.value);

        } else if(newAlbumName !== '' ){
            moveTrackToNewAlbum(track, newAlbumName);
        }
        if (lastTrack){
            setEditingAlbum(null);
        }
        onClose();
    }
    const inputForNewAlbum = (e) => {
        setNewAlbumName(e.target.value);
    }
    useEffect(() => {
        albums.find(({uuid}) => uuid === editingAlbum).tracks.length === 1 ? setLastTrack(true) : setLastTrack(false);

        const handleClickedOutside = (e) =>{            
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                if(e.target.closest('svg')?.id === 'volume-button' ){return;}
                onClose();
            }}

        document.addEventListener("mousedown", handleClickedOutside);
        document.addEventListener("touchstart", handleClickedOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickedOutside);
            document.removeEventListener("touchstart", handleClickedOutside);
        }
    },[]);
    return(
        <div className="trackRemapAlbum-container" >
            <div className="trackRemapAlbum" ref={wrapperRef}>
            <h2>Move track to another album</h2>
            { lastTrack && <p className="last-track-notify">Last track of the album, if you move it, the current album will be deleted.</p>}
            <form className="trackRemapAlbumForm" onSubmit={handleTrackRemap}>
                <label htmlFor="newAlbum">New album name</label>
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
    </div>
    )
}

export default TrackRemapAlbumAddMusic;