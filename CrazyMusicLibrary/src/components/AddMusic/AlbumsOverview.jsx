import AlbumAdd from "./AlbumAdd";
import AlbumCard from "./AlbumCard";
import RadioCard from "./RadioCard";

const AlbumsOverview = ({albums, radios, deleteRadio, addNewMusic, deleteAlbum, editAlbum, publish}) =>{
    const cardsAlbum = albums.map((album, index) => <AlbumCard album={album} key={`alb-${index}`} deleteAlbum={deleteAlbum} editAlbum={editAlbum}/>)
    const cardsRadio = [...radios].map((radio, index) => <RadioCard radio={radio} key={`rad-${index}`} deleteRadio={deleteRadio}/>)

    const cards = [...cardsAlbum, ...cardsRadio];
    console.log("rerun");
    cards.push(<AlbumAdd key={-1} addNewMusic={addNewMusic}/>);
    return(
        <div className="albums-overview">
            <div className="album-overview-container">{cards.reverse()}</div>
            {/* <button className="roundButton" onClick={addNewMusic}>Add new music</button> */}
            {(albums.length > 0 || radios.size > 0) && <button className="roundButton" onClick={publish}>Publish to library</button>}

        </div>
    )
}

export default AlbumsOverview;