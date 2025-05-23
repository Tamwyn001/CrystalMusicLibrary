import { useEffect, useState } from 'react';
import CML_logo from '../CML_logo';
import './AlbumWrapping.css'
import { IconMountain, IconFolderPlus, IconDirections } from '@tabler/icons-react';
import { useAddMusicContext } from '../AddMusic';
import TrackRemapAlbumAddMusic from './TrackRemapAlbum';
import { FixedSizeList as List } from 'react-window';


const AlbumWrapping = ({setEditUid, albumClass}) => {
    const [showTrackRemap, setShowTrackRemap] = useState({visible: false});
    const [coverURL, setCoverURL] = useState(null);
    if(!albumClass) return null;

    //only load when the albumClass is set
    useEffect(() => {
        if (albumClass) {
            setCoverURL(albumClass.coverURL);
        }
    }, [albumClass]);
    const handleApply = () => {
        const form = document.getElementById("editAlbumInfos");
        albumClass.name = form.albumName.value;
        albumClass.artist = form.artistName.value.split(",").map((g) => g.trim());
        albumClass.year = form.releaseDate.value;
        albumClass.genre = form.genre.value.split(",").map((g) => g.trim()).map(g => g.charAt(0).toUpperCase() + g.slice(1));
        albumClass.description = form.description.value;
        console.log( albumClass.genre);
        //switch to the album overview
        setEditUid(null);
    }
    const selectNewImage = (e) => {
        const file = e.target.files[0];
        if(file){
            setCoverURL(albumClass.setCoverFromFile(file));
        }
    }

    const openTrackRemap = (track) => {
        setShowTrackRemap({visible: !showTrackRemap.visible, ...track});
    }
    return(
        <div className="albumWrapping">
            <div className="albumCover">
                <div className="albumCoverImageEdit">
                    {(coverURL)? <img id="coverPicture" src={coverURL} style={{width: "100%"}}/>
                    : <CML_logo id="coverPicture" style={{width: "100%"}}/>}
                    <label htmlFor="coverInput">
                        <IconFolderPlus/>
                    </label>
                    <input type="file" id="coverInput" style={{display: "none"}} accept="image/*" onChange={selectNewImage} />
                </div>
                <button className="roundButton" onClick={() => handleApply()}>Apply</button>
            </div>
            <form className="albumDetails" id='editAlbumInfos' >
                <label htmlFor="albumName">Album name</label>
                <input type="text" id="albumName" placeholder="Enter album name" defaultValue={albumClass.name} />
                <label htmlFor="artistName">Artists name</label>
                <input type="text" id="artistName" placeholder="Enter artist name" defaultValue={albumClass.artist?.toString().replace(/,/g, ', ')}/>
                <div className="albumType">
                    <div className="albumTypeOption">
                        <label htmlFor="releaseDate">Release date</label>
                        <input type="date" id="releaseDate" defaultValue={albumClass.year}/>
                    </div>
                    <div className="albumTypeOption">
                        <label htmlFor="genre">Genres</label>
                        <input type="text" id="genre" placeholder="Enter genres: G1, G2,..." defaultValue={albumClass.genre?.toString().replace(/,/g, ', ')}/>
                    </div>
                    <div className="albumTypeOption">
                        <label htmlFor="description">Description</label>
                        <textarea id="description" placeholder="Enter description" defaultValue={albumClass.description}></textarea>
                    </div>
                    {/* <div className="albumTypeOption">
                        <label htmlFor="bpm">BPM</label>
                        <input type="number" id="bpm" placeholder="Enter BPM" defaultValue={albumClass.bpm}/>
                    </div> */}
                    
                </div>
                <div className="albumTracks">
                    <List
                        className="albumTrackList"
                        height={250}
                        itemCount={albumClass.tracks.length}
                        itemSize={35}
                        width={"100%"}
                    >
                        {({ index, style }) => (
                            <div key={index} style={style} className="album-wrapping-track">
                             <span>{albumClass.tracks[index].name}</span>
                             <IconDirections className="trackIcon" onClick={() => {openTrackRemap(albumClass.tracks[index])}}/>
                         </div>
                        )}
                    </List>
                </div>
            </form>
            {showTrackRemap.visible && < TrackRemapAlbumAddMusic onClose={() => {setShowTrackRemap({visible: false})}} track={{id: showTrackRemap.id, name: showTrackRemap.name}} />}

        </div>
    )
}

export default AlbumWrapping;
