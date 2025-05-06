import { useNavigate } from "react-router-dom";
import CML_logo from "./CML_logo";
import apiBase from "../../APIbase";

const PlaylistCard = ({playlist}) => {
    const navigate = useNavigate();
    const viewPlaylist = (id) => {
        navigate(`/playlists/${id}`);
    }
    return(
        <div className="artist-card" onClick={()=> viewPlaylist(playlist.id)}>
            {(playlist.cover)?
            <img src={`${apiBase}/covers/${playlist.cover}`} alt={`${playlist.name} cover`} className="artist-card-cover" />
            : <CML_logo className="cover-image" />}
            <h3 className="artist-name">{playlist.name}</h3>
        </div>
    )
}
export default PlaylistCard;