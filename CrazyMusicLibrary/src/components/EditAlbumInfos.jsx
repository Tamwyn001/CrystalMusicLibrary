import { useEffect, useState } from 'react';
import CML_logo from './CML_logo';
import './AddMusic/AlbumWrapping.css'
import { IconFolderPlus, IconDirections, IconTrashFilled, IconTrashX, IconTrash } from '@tabler/icons-react';
import { FixedSizeList as List } from 'react-window';
import TrackRemapAlbum from './TrackRemapAlbum';
import ButtonWithCallback from './ButtonWithCallback';
import apiBase from '../../APIbase';
import { useNotifications } from '../GlobalNotificationsProvider';
import { useNavigate } from 'react-router-dom';
import { useAudioPlayer } from '../GlobalAudioProvider';


const EditAlbumInfos = ({applyCanges, albumClass}) => {
    const [showTrackRemap, setShowTrackRemap] = useState({visible: false});
    const [coverURL, setCoverURL] = useState(null);
    const [date, setDate] = useState("2000-00-00"); // Set the default date to today
    const [fileOverwrite, setFileOverwrite] = useState(null);
    const [ remapedSomeTrack, setRemapedSomeTracks ] = useState(false)
    const {deleteAlbum } = useAudioPlayer();
    if(!albumClass) return null;

    //only load when the albumClass is set
    useEffect(() => {
        if (albumClass) {
            setCoverURL(albumClass.coverURL);
            setDate(albumClass.year);
        }
    }, [albumClass]);

    const handleApply = () => {
        const form = document.getElementById("editAlbumInfos");
        const recompiledArtist = form.artistName.value.split(",").map((g) => g.trim());
        const recompiledGenre = form.genre.value.split(",").map((g) => g.trim()).map(g => g.charAt(0).toUpperCase() + g.slice(1)).filter(g => g != "");

        let changeOperated = ((form.albumName.value !== albumClass.name) 
            || (albumClass .artist.toString() !== recompiledArtist.toString()) 
            || (albumClass.year !== form.releaseDate.value) 
            || (albumClass.genre.toString() !== recompiledGenre.toString()) 
            || (albumClass.description !== form.description.value)
            || (fileOverwrite)
            || remapedSomeTrack);
        if (!changeOperated) {
            applyCanges(null);
            return;
        }
        albumClass.name = form.albumName.value;
        albumClass.artist = recompiledArtist;
        albumClass.year = form.releaseDate.value;
        albumClass.genre = recompiledGenre
        albumClass.description = form.description.value;
        //switch to the album overview
        const {tracks, coverURL,...updatedAlbum} = albumClass;
        console.log(updatedAlbum);
        applyCanges(updatedAlbum, fileOverwrite);
    }
    const selectNewImage = (e) => {
        const file = e.target.files[0];
        if(file){
            //for uploading a new cover we need an object album.uuid/id, album.ext
            albumClass.ext = file.name.split('.').pop();
            setCoverURL(URL.createObjectURL(file));
            setFileOverwrite(file);
        }
    }

    const openTrackRemap = (track) => {
        setShowTrackRemap({visible: !showTrackRemap.visible, ...track});
    }

    const closeTrackRemap = (remaped) => {
        console.log(remaped)
        if(!remapedSomeTrack && remaped) {
            setRemapedSomeTracks(true);
        }
        setShowTrackRemap({visible: false})
    }

    
    return(
        <div className="albumWrapping-library-container">
            <div className="albumWrapping-library">
                <div className="albumCover"  edit="true">
                    <div className="albumCoverImageEdit">
                        {(coverURL)? <img id="coverPicture" src={coverURL} style={{width: "100%"}}/>
                        : <CML_logo id="coverPicture" style={{width: "100%"}}/>}
                        <label htmlFor="coverInput">
                            <IconFolderPlus/>
                        </label>
                        <input type="file" id="coverInput" style={{display: "none"}} accept="image/*" onChange={selectNewImage} />
                    </div>
                    <button className="roundButton" onClick={() => handleApply()}>Apply</button>
                    <ButtonWithCallback  onClick={async() => {
                        deleteAlbum(true, {name: albumClass.name, id: albumClass.id});}}
                         text={"Delete for me"} icon={<IconTrash/>}
                         style={{marginTop: "auto"}}/>
                    <ButtonWithCallback  onClick={async() => {
                        deleteAlbum(false, {name: albumClass.name, id: albumClass.id});}}
                         text={"Remove from library"} icon={<IconTrash/>}/>

                </div>
                <form className="albumDetails" id='editAlbumInfos' >
                    <label htmlFor="albumName">Album name</label>
                    <input type="text" id="albumName" placeholder="Enter album name" defaultValue={albumClass.name} />
                    <label htmlFor="artistName">Artists name</label>
                    <input type="text" id="artistName" placeholder="Enter artist name" defaultValue={albumClass.artist?.toString().replace(/,/g, ', ')}/>
                    <div className="albumType">
                        <div className="albumTypeOption">
                            <label htmlFor="releaseDate">Release date</label>
                            <input type="date" id="releaseDate" value={date} onChange={(e)=>{setDate(e.target.value)}}/>
                        </div>
                        <div className="albumTypeOption">
                            <label htmlFor="genre">Genres</label>
                            <input type="text" id="genre" placeholder="Enter genres: G1, G2,..." defaultValue={albumClass.genre?.toString().replace(/,/g, ', ')} />
                        </div>
                        <div className="albumTypeOption">
                            <label htmlFor="description">Description</label>
                            <textarea id="description" placeholder="Enter description" defaultValue={albumClass.description}></textarea>
                        </div>
                        
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
                                <span>{albumClass.tracks[index].title}</span>
                                <IconDirections className="trackIcon" onClick={() => {openTrackRemap(albumClass.tracks[index])}}/>
                            </div>
                            )}
                        </List>
                    </div>
                </form>
                {showTrackRemap.visible && < TrackRemapAlbum onClose={closeTrackRemap} track={{id: showTrackRemap.id, title: showTrackRemap.title}} />}
        </div>                       
    </div>
    )
}

export default EditAlbumInfos;
