import apiBase from '../../APIbase';
import './AddMusic/AlbumCard.css';
import { useNavigate } from 'react-router-dom';
import CML_logo from './CML_logo';
const LibAlbumCard = ({album}) => {
    const navigate = useNavigate();
    const viewAlbum = (id) => {
        navigate(`/albums/${id}`);
    }
    return(
        <div className="album-card" onClick={()=> viewAlbum(album.id)}>
            {(album.cover)?
            <img src={`${apiBase}/covers/${album.cover}`} alt={`${album.title} cover`} className="album-card-cover" />
            : <CML_logo className="cover-image" />}
            <h3 className="album-name">{album.title}</h3>
            <p className="album-artist">{album.artist || "No artist"}</p>
        </div>
    )
}

export default LibAlbumCard;