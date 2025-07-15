import './AlbumCard.css';
import {trimString} from '../../../lib';
import {IconPencil, IconFileMusic, IconTrash} from "@tabler/icons-react";

const AlbumCard = ({album, deleteAlbum, editAlbum}) => {

    return(
        <div className="album-card" context={"add"}>
            <IconTrash className='album-card-overview-button' use="delete" onClick={() => deleteAlbum(album.uuid)} />
            <IconPencil className='album-card-overview-button' use="edit"  onClick={() => editAlbum(album.uuid)} />
            <div className="album-card-overview-button" use="song-count">
                < IconFileMusic className='song-count-icon'/>
                <span>{album.tracks.length}</span>
            </div>
            <img src={album.coverURL} className="album-card-cover" />
            <h3 className="album-name">{trimString(album.name, 25)}</h3>
            <p className="album-artist">{trimString(album.artist.join(","), 25) || "No artist"}</p>
        </div>
    )
}

export default AlbumCard;