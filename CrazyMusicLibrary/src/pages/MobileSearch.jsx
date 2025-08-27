import { IconDots, IconSearch } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { FixedSizeList as List  } from "react-window";
import apiBase from "../../APIbase";
import ActionBarEntry from "../components/ActionBarEntry";
import CML_logo from "../components/CML_logo";
import { useAudioPlayer } from "../GlobalAudioProvider";
import { useNavigate } from "react-router-dom";


const searchType = {
    TRACK : "track",
    PLAYLIST : "playlist",
    ALBUM : "album",
    GENRE : "genre",
    ARTIST : "artist",
    RADIO : "radio"
 }
const MobileSearch = () =>{

    const searchInputRef = useRef(null);
    const [searchbarFocused, setSearchbarFocused] = useState(false);
    const [entries, setEntries] = useState([]);
    const {openTrackActions, playTrackNoQueue} = useAudioPlayer();
    const navigate = useNavigate();
    const fetchSearchResults = (e) => {
        const input = e.target.value;

        if (input === "" || input.trim().length === 0) {setEntries([]);return;} //return if empty or only white spaces
        console.log(`${apiBase}/read-write/search/${input}`);
        fetch(`${apiBase}/read-write/search/${input}`, {
            method: "GET",
        credentials:"include"})
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
            throw new Error("Error fetching search results");
        })
        .then((data) => {
            const remappedTrack = [...data.tracks?.map(track => {return({type : "track", ...track})}),
                                   ...data.albums?.map(track => {return({type : "album", ...track})}),
                                   ...data.artists?.map(track => {return({type : "artist", ...track})}),
                                   ...data.genres?.map(track => {return({type : "genre", ...track})}),
                                   ...data.playlists?.map(track => {return({type : "playlist", ...track})})]
                .map((item) => { 
                    const fileName = item.path;
                    const {trackPath, ...itemSorted} = item;
                    const entryCode =  item.type === 'artist' ? searchType.ARTIST :
                        item.type === 'album' ? searchType.ALBUM :
                        item.type === 'genre' ? searchType.GENRE :
                        item.type === "playlist" ? searchType.PLAYLIST :
                        searchType.TRACK;
                    return {icon : () => {return ((fileName) ? <img className="action-bar-entry-logo" 
                            src={`${apiBase}/${item.type === 'artist' ? "artist" : "covers"}/${fileName}`} 
                            alt={item.name}/> : <CML_logo className="action-bar-entry-logo" />) },
                            tooltip : () => <IconDots 
                            onClick={(e)=>{openEntryDots(e, {code : entryCode, id: item.id})}}/>,
                            code : entryCode,
                            fileName : fileName,
                            ...itemSorted}});
            console.log(remappedTrack);
            setEntries(remappedTrack);
        })
        
    }
    /**
     * 
     * @param {React.MouseEvent} event 
     * @param {{code : typeof searchType, id : string | int }} entryObject
     */
    const openEntryDots = (event, entryObject) =>{
            // setActionsOpened(true);
            openTrackActions({x:event.clientX, y: event.clientY},
                 entryObject,()=>{},
                  () => {})
    }
    const onClickArroundSearch = (e) => {
        if(searchbarFocused){return}
        setTimeout(() => {
            requestAnimationFrame(() => {
              searchInputRef.current?.focus();
            });
          }, 0);
    }
    const handleActionBarEntryClick = (entry) => {
        // console.log(entry);
        switch(entry.code){
            case searchType.TRACK:
                playTrackNoQueue(entry.id); 
                break;
            case searchType.ALBUM:
                navigate(`/albums/${entry.id}`);
                break;
            case searchType.ARTIST:
                navigate(`/artists/${entry.id}`);
                break;
            case searchType.GENRE:
                navigate(`/genres/${entry.id}`);
                break;
            case searchType.PLAYLIST:
                navigate(`/playlists/${entry.id}`);
                break;
            
        }
    };

    return <div className="action-bar" id="researchbar" >
    <div className="action-bar-research" 
        onClick={onClickArroundSearch} >
        <div className="action-bar-logo-container"><IconSearch className="action-bar-current-logo" /> </div>
        <input
            className="searchbar"
            type="text"
            id="playlist-searchbar"
            onChange={fetchSearchResults}
            placeholder="Search for tracks, artists, genres, playlists.."
            ref={searchInputRef}
            onFocus={() => { setSearchbarFocused(true); }}/>

    <div className="action-bar-results" style={{display : `${(searchbarFocused) ?  "block": "none"}`}} >
    {/* <List
        height={300}
        itemCount={entires.length}
        itemSize={70}
    >
        {({ index, style }) => 
            
        }

    </List>*/}
    {entries.map((entry, id) => <ActionBarEntry key={id} entry={entry} 
                className="from-search-bar"
                
                onClick={handleActionBarEntryClick}/>)}
    </div> 
    </div>
    
</div>
}
export default MobileSearch;