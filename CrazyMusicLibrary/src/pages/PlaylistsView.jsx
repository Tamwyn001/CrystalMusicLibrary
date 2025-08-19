import { useEffect, useState } from "react";
import apiBase from "../../APIbase.js";
import PlaylistCard from "../components/PlaylistCard.jsx";
import { IconCategoryPlus } from "@tabler/icons-react";
import ButtonWithCallback from "../components/ButtonWithCallback.jsx";
import { useAudioPlayer } from "../GlobalAudioProvider.jsx";
import { asVerified, verifyToken } from "../../lib.js";

const PlaylistsView = () => {
    const [playlists, setPlaylists] = useState([]);
    const { createNewPlaylist, setPlaylistAddedCallback } = useAudioPlayer();
 

    const refetch = () => {
        fetch(`${apiBase}/read-write/playlists`, {
            method : "GET",
            credentials : "include",
        }).then(res => res.json())
        .then(data => setPlaylists(data));
    }

    useEffect(() => {
        const verify = asVerified(() => {
            refetch();
            setPlaylistAddedCallback(refetch);
        });
        verify();   
    },[]);
    
    return(
        <div>
            <ButtonWithCallback className="buttonRound" onClick={createNewPlaylist} style={{marginBottom : "40px"}} icon={<IconCategoryPlus/>} text={"Create a new playlist"}/>
            <div className="album-displayer">
                {playlists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist}/>)}
            </div>
        </div>
    )
}

export default PlaylistsView;