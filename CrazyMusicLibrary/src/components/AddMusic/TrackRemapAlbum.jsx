import { useAddMusicContext } from "../AddMusic";
import './TrackRemapAlbum.css';
const TrackRemapAlbum = ({ track }) => {
    const {albums, moveTrackToNewAlbum, moveTrackToAlbum, editingAlbum} = useAddMusicContext();
    const [newAlbumName, setNewAlbumName] = useState(''); //if valid, we want a new album
    const handleTrackRemap = (e) => {
        e.preventDefault();
        if (newAlbumName){
            moveTrackToAlbum(track, e.target.existingAlbum.value);
        } else {
            moveTrackToNewAlbum(track, newAlbumName);
        }
    }
    const inputForNewAlbum = (e) => {
        setNewAlbumName(e.target.value);
    }

    return(
        <div className="trackRemapAlbum">
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