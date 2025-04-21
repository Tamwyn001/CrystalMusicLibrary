import apiBase from '../../APIbase';
import './AddMusic/AlbumCard.css';
import { useNavigate } from 'react-router-dom';
const LibAlbumCard = ({album}) => {
    const navigate = useNavigate();
    const viewAlbum = (id) => {
        navigate(`/albums/${id}`);
    }
    return(
        <div className="album-card" onClick={()=> viewAlbum(album.id)}>
            <img src={`${apiBase}/covers/${album.cover}`} className="album-card-cover" />
            <h3 className="album-name">{album.title}</h3>
            <p className="album-artist">{album.artist || "No artist"}</p>
        </div>
    )
}

export default LibAlbumCard;