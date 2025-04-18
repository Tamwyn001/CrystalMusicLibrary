import AlbumAdd from "./AlbumAdd";
import AlbumCard from "./AlbumCard";

const AlbumsOverview = ({albums, addNewMusic, deleteAlbum, editAlbum}) =>{
    let cards = [];
    let counter = 0;
    for(const album of albums){
        cards.push(<AlbumCard album={album} key={counter} deleteAlbum={deleteAlbum} editAlbum={editAlbum}/>);
        counter++;
    }
    cards.push(<AlbumAdd key={counter} addNewMusic={addNewMusic}/>);
    return(
        <div className="album-overview-container">{cards}</div>
    )
}

export default AlbumsOverview;