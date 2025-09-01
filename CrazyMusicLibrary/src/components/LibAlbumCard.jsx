import apiBase from '../../APIbase';
import {trimString} from '../../lib';

import './AddMusic/AlbumCard.css';
import { useNavigate } from 'react-router-dom';
import CML_logo from './CML_logo';
import { useEffect, useRef, useState } from 'react';
const LibAlbumCard = ({album, hideArtist = false}) => {
    const navigate = useNavigate();
    const [artists, setArtists] = useState([]);
    const [imgLoaded, setImgLoaded] = useState(false);
    const imgRef = useRef(null);
    const viewAlbum = (id) => {
        navigate(`/albums/${id}`);
    }
    useEffect(() => {
        if(!album.artists){ return;}
        setArtists(JSON.parse(album.artists).map((artist) => artist.name));
    },[album]);

    return(
        <div className="album-card" onClick={()=> viewAlbum(album.id)}>
            {(album.cover)?
            <div className="">
                {!imgLoaded && <div className="skeleton-loader-album" />}
                <img
                className='album-card-cover'
                ref={imgRef}
                src={`${apiBase}/covers/${album.cover}`}
                onLoad={() => setImgLoaded(true)}
                alt={album.title}
                style={{ display: imgLoaded ? "block" : "none" }}
                />
            </div>

            : <CML_logo className="cover-image" />}
            <h3 className="album-name">{trimString(album.title, 40)}</h3>
            {!hideArtist && <p className="album-artist">{ trimString(artists.toString().replace(/,/g, ', '), 25) || "No artist"}</p>}
        </div>
    )
}

export default LibAlbumCard;