import './AlbumWrapping.css'

import { IconMountain, IconFolderPlus } from '@tabler/icons-react';

const AlbumWrapping = ({setEditUid, albumClass}) => {
    if(!albumClass) return <></>;
    const handleApply = () => {
        const form = document.getElementById("editAlbumInfos");
        albumClass.name = form.albumName.value;
        albumClass.artist = form.artistName.value;
        albumClass.year = form.releaseDate.value;
        albumClass.genre = form.genre.value;
        albumClass.description = form.description.value;
        albumClass.bpm = form.bpm.value;

        //switch to the album overview
        setEditUid(null);
    }
    const selectNewImage = (e) => {
        const file = e.target.files[0];
        if(file){
            albumClass.coverURL =  URL.createObjectURL(file);
            document.getElementById("coverPicture").src =albumClass.coverURL;
        }
    }
    return(
        <div className="albumWrapping">
            <div className="albumCover">
                <div className="albumCoverImageEdit">
                    <img id="coverPicture" src={albumClass.coverURL} style={{width: "100%"}}/>
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
                    <div className="albumTypeOption">
                        <label htmlFor="bpm">BPM</label>
                        <input type="number" id="bpm" placeholder="Enter BPM" defaultValue={albumClass.bpm}/>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default AlbumWrapping;
