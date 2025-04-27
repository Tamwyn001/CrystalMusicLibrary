import { useEffect, useState } from 'react';
import CML_logo from '../CML_logo';
import './AlbumWrapping.css'

import { IconMountain, IconFolderPlus, IconDirections } from '@tabler/icons-react';
import { useAddMusicContext } from '../AddMusic';
import TrackRemapAlbum from './TrackRemapAlbum';

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
        albumClass.artist = form.artistName.value;
        albumClass.year = form.releaseDate.value;
        albumClass.genre = form.genre.value;
        albumClass.description = form.description.value;

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
                <label htmlFor="artistName">Artist name</label>
                <input type="text" id="artistName" placeholder="Enter artist name" defaultValue={albumClass.artist}/>
                <div className="albumType">
                    <div className="albumTypeOption">
                        <label htmlFor="releaseDate">Release date</label>
                        <input type="date" id="releaseDate" defaultValue={albumClass.year}/>
                    </div>
                    <div className="albumTypeOption">
                        <label htmlFor="genre">Genre</label>
                        <input type="text" id="genre" placeholder="Enter genre" defaultValue={albumClass.genre}/>
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
                    {albumClass.tracks.map((track, index) => {
                        return (
                            <div key={index} className="albumTrack">
                                <span>{track.name}</span>
                                <IconDirections className="trackIcon" onClick={() => {openTrackRemap(track)}}/>
                            </div>
                        )
                    })}
                </div>
            </form>
            {showTrackRemap.visible && < TrackRemapAlbum track={{id: showTrackRemap.id, name: showTrackRemap.name}} />}

        </div>
    )
}

export default AlbumWrapping;
