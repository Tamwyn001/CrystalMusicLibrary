import { IconFolderSearch, IconFolderSymlink } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react"
import { FixedSizeList as List } from "react-window";
import apiBase from "../../APIbase.js";
import ActionBarEntry from "./ActionBarEntry.jsx";
import { useNotifications } from "../GlobalNotificationsProvider.jsx";
import CML_logo from "./CML_logo.jsx";
const TrackRemapAlbum = ({onClose, track}) => {
    const [searchbarFocused, setSearchbarFocused ] = useState(false);
    const searchInputRef = useRef(null);
    const wrapperRef = useRef(null);
    const [ proposedEntryToAdd, setProposedEntryToAdd] = useState([]);
    const [ movingToExistingAlbum, setMovingToExistingAlbum ] = useState(null);
    const [ newAlbumName, setNewAlbumName ] = useState('');
    const { addNotification, notifTypes} = useNotifications();

    const handleTrackRemap = (e) =>{
        e.preventDefault();
        if(newAlbumName == '' && !movingToExistingAlbum){
            onClose(false);
            return;
        }   
        fetch(`${apiBase}/read-write/moveTrackToAlbum/${(newAlbumName) ? "true/" + newAlbumName : "false/" + movingToExistingAlbum.id }/${track.id}`)
        .then(res => res.json())
        .then(data => {addNotification(`Track ${track.title} moved to 
            ${(newAlbumName) ? newAlbumName : movingToExistingAlbum.name}.`
            , notifTypes.INFO); onClose(true);})
    }
    const inputForNewAlbum = (e) => {
        setMovingToExistingAlbum(null);
        setNewAlbumName(e.target.value)
    };

    const handleActionBarEntryClick = (item) =>{
        const {tooltip, ...albuminfos} = item;
        closeSearchBar();
        setMovingToExistingAlbum(albuminfos);
        setNewAlbumName('')
    };

    useEffect(() => {
        const handleClickedOutside = (e) =>{            
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                closeSearchBar();
            }}

        document.addEventListener("mousedown", handleClickedOutside);
        document.addEventListener("touchstart", handleClickedOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickedOutside);
            document.removeEventListener("touchstart", handleClickedOutside);
        }
    },[]);
    
    const closeSearchBar = () => {
        setSearchbarFocused(false);
        searchInputRef.current.value = ""
        setProposedEntryToAdd([]);
    }
    const getTooltipOnSearchResult = () => {
        return <div className="action-tooltip-div"> <span style={{margin: "0"}}>Move to album</span> {/*<IconFolderPlus className="action-bar-entry-tooltip-logo"/>*/}</div>;   
    }
    const fetchSearchResults = (e) => {
        const input = e.target.value;

        if (input === "" || input.trim().length === 0) {setProposedEntryToAdd([]);return;} //return if empty or only white spaces
        console.log(`${apiBase}/read-write/search/${input}/${["albums"]}`);
        fetch(`${apiBase}/read-write/search/${input}/${["albums"]}`, {
            method: "GET",credentials:"include"})
        .then((res) => res.json())
        .then(data => {
            setProposedEntryToAdd(
                [...data.albums].map(item => {
                    const fileName = item.path;
                    const {trackPath, ...itemSorted} = item;
                    return {icon : () => {return ((fileName) ? <img className="action-bar-entry-logo" 
                            src={`${apiBase}/covers/${fileName}`} 
                             alt={item.name}/> : <CML_logo className="action-bar-entry-logo" />) },
                             tooltip : getTooltipOnSearchResult,
                             ...itemSorted}
                }));
        });
    }
    return(
        <div className="trackRemapAlbum-container" >
            <div className="trackRemapAlbum" ref={null}>
            <h2>Move track to another album</h2>
            <form className="trackRemapAlbumForm" onSubmit={handleTrackRemap}>
                <label htmlFor="newAlbum" style={(newAlbumName)? {} : {opacity : "0.5"}}>New album name</label>
                <input type="text" style={(newAlbumName)? {} : {opacity : "0.5"}} id="newAlbum" placeholder="Enter album name" onChange={inputForNewAlbum} />
                <label htmlFor="existingAlbum" style={(newAlbumName)?  {opacity : "0.5"} : {}}>Existing album</label>
                <div className="action-bar" is-playlist-add={"true"} ref={wrapperRef} style={(newAlbumName)?  {opacity : "0.5"} : {}}>
                    <div className="action-bar-research" style={{transform: "translateX(15px)"}} id="playlist-researchbar">
                        <div className="action-bar-logo-container"><IconFolderSearch className="action-bar-current-logo" /> </div>
                        <input
                            className="searchbar"
                            type="text"
                            id="playlist-searchbar"
                            onChange={fetchSearchResults}
                            placeholder="Search the album you want to move the track to."
                            ref={searchInputRef}
                            onFocus={() => { setSearchbarFocused(true); }}/>
                            <div className="action-bar-results" style={{display : `${(searchbarFocused) ?  "block": "none"}`}} >
                    <List
                        height={300}
                        itemCount={proposedEntryToAdd.length}
                        itemSize={50}
                        width={'calc(100% - 0px)'}
                        
                        style={{overflowY: "auto", marginBottom: "20px"}}
                    >
                        {({ index, style }) => 
                            <ActionBarEntry key={index} entry={proposedEntryToAdd[index]} 
                                style={{...style, width:" calc(100% - 20px)", marginTop: "10px"}} 
                                onClick={handleActionBarEntryClick}/>
                        }

                    </List>
                    </div>
                    </div>
                    
                </div>
                {(movingToExistingAlbum)  ?
                    <div style={{height : "90px", alignItems : "center", display : "flex", gap : "10px"}}>
                        {movingToExistingAlbum?.icon ? movingToExistingAlbum.icon()
                        : null
                        }
                        {movingToExistingAlbum.name}
                    </div>
                : null
                }
                <input type="submit" value="Submit"/>
            </form>  
        </div>
    </div>
    )

}
export default TrackRemapAlbum;