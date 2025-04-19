import './AddMusic/AlbumCard.css';

const LibAlbumCard = ({album}) => {

    return(
        <div className="album-card">
            <img src={album.coverURL} className="album-card-cover" />
            <h3 className="album-name">{album.name}</h3>
            <p className="album-artist">{album.artist || "No artist"}</p>
        </div>
    )
}

export default LibAlbumCard;