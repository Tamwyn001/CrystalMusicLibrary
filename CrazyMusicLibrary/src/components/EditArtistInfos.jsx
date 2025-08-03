import { useEffect, useState } from 'react';
import CML_logo from './CML_logo';
import './AddMusic/AlbumWrapping.css'
import { IconFolderPlus} from '@tabler/icons-react';

import apiBase from '../../APIbase';


const EditArtistInfos = ({applyChanges, artist}) => {
    const [coverURL, setCoverURL] = useState(null);
    const [date, setDate] = useState("2000-00-00"); // Set the default date to today
    const [fileOverwrite, setFileOverwrite] = useState(null);
    if(!artist) return null;

    //only load when the albumClass is set
    useEffect(() => {
        if (artist) {
            setCoverURL(artist.picture);
            setDate(artist.active_from);
        }
    }, [artist]);

    const handleApply = () => {
        const form = document.getElementById("editArtistInfos");
        const activeClass = artist.active_from ?? "";
        const activeForm = form.activeFrom.value ?? "";
        const nameClass = artist.name ?? "";
        const nameForm = form.artistName.value ?? "";
        const bioClass = artist.bio ?? "";
        const bioForm = form.bio.value ?? "";
        let changeOperated = ((nameClass != nameForm)  
            || (activeClass != activeForm)  
            || (bioClass != bioForm)
            || (fileOverwrite));
        if (!changeOperated) {
            applyChanges(null);
            return;
        }
        artist.name = form.artistName.value;
        artist.active_from = form.activeFrom.value;
        artist.bio = form.bio.value;
        //switch to the album overview
        const {picture,...updatedAlbum} = artist;
        console.log(updatedAlbum, fileOverwrite);
        applyChanges(updatedAlbum, fileOverwrite);
    }
    const selectNewImage = (e) => {
        const file = e.target.files[0];
        if(file){
            //for uploading a new cover we need an object album.uuid/id, album.ext
            artist.ext = file.name.split('.').pop();
            setCoverURL(URL.createObjectURL(file));
            setFileOverwrite(file);
        }
    }



    const deleteAlbum = async (forMe) => {
        const deletionParams = forMe ? "/forMe" : "";
        const res = await fetch(`${apiBase}/read-write/delete/album/${artist.id}${deletionParams}`,
            {
                method : "DELETE",
                credentials : "include"
            }
        )
            .then(res=>res.json());
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
                    <button className="roundButton" onClick={handleApply}>Apply</button>
                    {/* <ButtonWithCallback  onClick={async() => {deleteAlbum(true);}} text={"Delete for me"} icon={<IconTrash/>}/> */}
                    {/* <ButtonWithCallback  onClick={async() => {deleteAlbum(false);}} text={"Remove from library"} icon={<IconTrash/>}/> */}

                </div>
                <form className="albumDetails" id='editArtistInfos' >
                    <label htmlFor="artistName">Artist name</label>
                    <input type="text" id="artistName" placeholder="Enter album name" defaultValue={artist.name} />
                    <div className="albumType">
                        <div className="albumTypeOption">
                            <label htmlFor="activeFrom">Active since</label>
                            <input type="date" id="activeFrom" value={date} onChange={(e)=>{setDate(e.target.value)}}/>
                        </div>
                        
                        
                    </div>
                    <div className="albumTypeOption">
                            <label htmlFor="bio">Bio</label>
                            <textarea id="bio" placeholder="Enter biography" defaultValue={artist.bio}></textarea>
                        </div>
                </form>
        </div>                       
    </div>
    )
}

export default EditArtistInfos;
