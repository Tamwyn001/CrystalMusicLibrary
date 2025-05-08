import { IconLabel, IconSearch } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import ActionBarEntry from "../components/ActionBarEntry";
import apiBase from "../../APIbase";

const Cooking = () => {
    const wrapperRef = useRef(null);
    const searchInputRef = useRef(null);
    const [searchbarFocused, setSearchbarFocused] = useState(false)
    const [ proposedEntryToAdd, setProposedEntryToAdd] = useState([])
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
                return {...tag, icon : () => <IconLabel/>}
            })
            setProposedEntryToAdd(proposed);})

    }
    const handleActionBarEntryClick = () => {

    }
    return(
        <div className="cooking-div">
            <h2>Here select some tags and play the music!</h2>
            <div className="action-bar" style={{margin : "auto"}} ref={wrapperRef}>
                <div className="action-bar-research" id="playlist-researchbar" >
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
        </div>
    )
}

export default Cooking;