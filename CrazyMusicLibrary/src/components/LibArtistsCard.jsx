import apiBase from '../../APIbase';
// import './AddMusic/artistCard.css';
import { useNavigate } from 'react-router-dom';
import CML_logo from './CML_logo';
const LibArtistsCard = ({artist}) => {
    const navigate = useNavigate();
    const viewArtist = (id) => {
        navigate(`/artists/${id}`);
    }
    return(
        <div className="artist-card" onClick={()=> viewArtist(artist.id)}>
            {(artist.picture)?
            <img src={`${apiBase}/covers/artists/${artist.picture}`} alt={`${artist.name} cover`} className="artist-card-cover" />
            : <CML_logo className="cover-image" />}
            <h3 className="artist-name">{artist.name}</h3>
        </div>
    )
}

export default LibArtistsCard;