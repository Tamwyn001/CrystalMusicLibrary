import './albumCard.css';

import {IconMountain, IconFileMusic} from "@tabler/icons-react";

const AlbumCard = ({album}) => {

    return(
        <div className="album-card">
            <div className="album-card-song-count">
                < IconFileMusic className='song-count-icon'/>
                <span>{album.tracks.length}</span>
            </div>
            <img src={album.coverURL} className="album-card-cover" />
            <h3 className="album-name">{album.name}</h3>
            <p className="album-artist">{album.artist || "No artist"}</p>
        </div>
    )
}

export default AlbumCard;