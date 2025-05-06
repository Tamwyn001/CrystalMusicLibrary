import { useEffect, useState } from 'react';
import CML_logo from './CML_logo';
import './AddMusic/AlbumWrapping.css'
import { IconMountain, IconFolderPlus, IconDirections, IconUserMinus } from '@tabler/icons-react';
import TrackRemapAlbum from './AddMusic/TrackRemapAlbum';
import { FixedSizeList as List } from 'react-window';
import apiBase from '../../APIbase';
import { v4 as uuidv4} from 'uuid';


const CreatePlaylist = ({applyCanges}) => {
    const [coverURL, setCoverURL] = useState(null);
    const [fileOverwrite, setFileOverwrite] = useState(null);
    const [playlistClass, setPlaylistClass] = useState({uuid : uuidv4()});
    const [possibleCollaborators, setPossibleCollaborators] = useState([])
    const [collaborators, setCollaborators] = useState([]);

    //only load when the playlistClass is set
    useEffect(() => {
        if (playlistClass) {
            setCoverURL(playlistClass.coverURL);
        }
    }, [playlistClass]);
    const handleApply = () => {
        const form = document.getElementById("editAlbumInfos");
        let changeOperated = ((form.playlistName.value !== playlistClass.name) 
            || (playlistClass.description !== form.description.value)
            || (fileOverwrite));
        if (!changeOperated) {
            applyCanges(null);
            return;
        }
        playlistClass.name = form.playlistName.value;
        playlistClass.description = form.description.value;
        playlistClass.collaborators = collaborators.map((user) => user.id);
        //switch to the album overview
        const {tracks, coverURL,...updatedPlaylist} = playlistClass;
        console.log(updatedPlaylist);
        applyCanges(updatedPlaylist, fileOverwrite);
    }
    const selectNewImage = (e) => {
        const file = e.target.files[0];
        if(file){
            //for uploading a new cover we need an object album.uuid/id, album.ext
            playlistClass.ext = file.name.split('.').pop();
            setCoverURL(URL.createObjectURL(file));
            setFileOverwrite(file);
        }
    }

    useEffect(() => {
        fetch(`${apiBase}/auth/collaborators`, {
            method: "GET",
            credentials : "include"
        }).then(res => res.json())
        .then(data => {console.log(data);setPossibleCollaborators(data);})
    }, [])

    const addNewCollab = (e) =>{
        const choice = e.target.value;
        // console.log(choice);
        if(collaborators.includes(choice) || choice === "pickUsers") return;
            setCollaborators(prev => [...prev, possibleCollaborators.find((user) => {return user.id == choice})]);
            e.target.value = "pickUsers";
    }
    useEffect(() => {console.log(collaborators), [collaborators]});

    const removeCollab = (id) =>{
        setCollaborators(collaborators.filter((user) => {return user.id != id}));
    }
    return(
        <div className="albumWrapping-library-container">
            <div className="albumWrapping-library">
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
                    <label htmlFor="playlistName">Playlist name</label>
                    <input type="text" id="playlistName" placeholder="Enter album name" defaultValue={playlistClass?.name} />
                    <div className="albumTypeOption">
                        <label htmlFor="description">Description</label>
                        <textarea id="description" 
                            style={{height : "80px", paddingTop : "10px", paddingBottom : "10px"}}
                            placeholder="Enter description" defaultValue={playlistClass?.description}/>
                    </div>
                    <label htmlFor='new-collab'>Add collaborators</label>
                    <select onChange={addNewCollab}>
                        <option value="pickUsers" key={"root"}>Pick users</option>
                        {possibleCollaborators.map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}
                    </select>
                    <label>Collaborators:</label>
                    <div>
                        {collaborators.map((user) => {return (
                            <div key={user?.id} >
                                <span>{user?.username}</span>
                                <IconUserMinus className='buttonRound' onClick={() => {removeCollab(user.id)}}/>
                            </div>    
                        )})}
                    </div>
                </form>

        </div>                       
    </div>
    )
}

export default CreatePlaylist;
