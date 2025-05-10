import { IconLabel, IconMusicCode, IconSearch, IconTagStarred, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import ActionBarEntry from "../components/ActionBarEntry";
import apiBase from "../../APIbase";
import CookingTagEntry from "../components/CookingTagEntry";
import '../components/TagEditor.css';
import './Cooking.css';
import ButtonWithCallback from "../components/ButtonWithCallback";
import { useAudioPlayer } from "../GlobalAudioProvider";
import { useNotifications } from "../GlobalNotificationsProvider";

const Cooking = () => {
    const wrapperRef = useRef(null);
    const searchInputRef = useRef(null);
    const [searchbarFocused, setSearchbarFocused ] = useState(false);
    const [ proposedEntryToAdd, setProposedEntryToAdd ] = useState([]);
    const [ currentCookingContent, setCurrentCookingContent ] = useState([]);
    const { playAudioSalad } = useAudioPlayer();
    const {addNotification, notifTypes } = useNotifications();
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
    
    const fetchSearchResults = (e) => {
        const input = e.target.value;

        if (input === "" || input.trim().length === 0) {setProposedEntryToAdd([]);return;} //return if empty or only white spaces
        console.log(`${apiBase}/read-write/search/${input}/tags`);
        fetch(`${apiBase}/read-write/search/${input}/tags`, {
            method: "GET"})
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
            throw new Error("Error fetching search results");
        })
        .then((data) => {
            
            const proposed = data.tags?.map(tag => {
                return {...tag, icon : () => <IconLabel color={tag.color}/>}
            })
            console.log(proposed);
            setProposedEntryToAdd(proposed);})

    }
    const closeSearchBar = () => {
        setSearchbarFocused(false);
    }
    const removeTagFromTrack = (id) => {
        setCurrentCookingContent(prev => prev.filter(tag => tag.id !== id));
    }

    const handleActionBarEntryClick = (id) => {
        closeSearchBar();
        if(currentCookingContent.find(tag => tag.id === id.id)){return}
        setCurrentCookingContent(prev => [...prev, id]);
    }
    const playSalad = async () => {
        playAudioSalad(currentCookingContent.map(tag => tag.id));
    }

    const saveSalad = async () =>{
        addNotification("Avaliale soon :)", notifTypes.SALAD);
    }
    return(
        <div className="cooking-div">
            <h2>Here select some tags and play the music!</h2>
            <div className="action-bar" style={{margin : "auto"}} ref={wrapperRef}>
                <div className="action-bar-research" id="playlist-researchbar" style={{zIndex : "2"}} >
                    <div className="action-bar-logo-container"><IconSearch className="action-bar-current-logo" /> </div>
                    <input
                        className="searchbar"
                        type="text"
                        id="playlist-searchbar"
                        onChange={fetchSearchResults}
                        placeholder="Search some tags.."
                        ref={searchInputRef}
                        onFocus={() => { setSearchbarFocused(true); }}/>
                </div>
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
            <div className="cooking-selection">
                <div className="cooking-actions">
                <ButtonWithCallback text={'Play the salad'} icon={<IconMusicCode/>} onClick={playSalad}/>
                <ButtonWithCallback text={'Save this salad'} icon={<IconTagStarred />} onClick={saveSalad}/>
                </div>
                <div className="cooking-tags">
                    {currentCookingContent.map(tag =>                     
                        <div key={tag.id} className="small-tag" style={{backgroundColor : tag.color}}>
                            <span>{tag.name}</span> <IconX onClick={() => {removeTagFromTrack(tag.id)}}/>
                        </div>)}
                </div>
            </div>
        </div>
    )
}

export default Cooking;