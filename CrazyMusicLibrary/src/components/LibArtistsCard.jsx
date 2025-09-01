import apiBase from '../../APIbase';
// import './AddMusic/artistCard.css';
import { useNavigate } from 'react-router-dom';
import CML_logo from './CML_logo';
import { useState } from 'react';
const LibArtistsCard = ({artist}) => {
    const navigate = useNavigate();
    const [imgLoaded, setImgLoaded] = useState(false);
    
    const viewArtist = (id) => {
        navigate(`/artists/${id}`);
    }
    return(
        <div className="artist-card" onClick={()=> viewArtist(artist.id)}>
            {(artist.picture)?<>
            {!imgLoaded && <div className="skeleton-loader-album" />}
            <img src={`${apiBase}/covers/artists/${artist.picture}`}
             alt={`${artist.name} cover`} 
             onLoad={() => setImgLoaded(true)}
             className="artist-card-cover" /></>
            : <CML_logo className="cover-image" />}
            <h3 className="artist-name">{artist.name}</h3>
        </div>
    )
}

export default LibArtistsCard;