import './albumCard.css';

import {IconPencil, IconFileMusic, IconTrash} from "@tabler/icons-react";

const AlbumCard = ({album, deleteAlbum, editAlbum}) => {

    return(
        <div className="album-card">
            <IconTrash className='album-card-overview-button' use="delete" onClick={() => deleteAlbum(album.uuid)} />
            <IconPencil className='album-card-overview-button' use="edit"  onClick={() => editAlbum(album.uuid)} />
            <div className="album-card-overview-button" use="song-count">
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