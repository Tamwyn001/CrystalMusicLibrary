import AlbumAdd from "./AlbumAdd";
import AlbumCard from "./AlbumCard";

const AlbumsOverview = ({albums, addNewMusic, deleteAlbum, editAlbum, publish}) =>{

    const cards = albums.map((album, index) => <AlbumCard album={album} key={index} deleteAlbum={deleteAlbum} editAlbum={editAlbum}/>)
    console.log("rerun");
    cards.push(<AlbumAdd key={-1} addNewMusic={addNewMusic}/>);
    return(
        <div className="albums-overview">
            <div className="album-overview-container">{cards.reverse()}</div>
            {/* <button className="roundButton" onClick={addNewMusic}>Add new music</button> */}
            {albums.length > 0 && <button className="roundButton" onClick={publish}>Publish to library</button>}

        </div>
    )
}

export default AlbumsOverview;