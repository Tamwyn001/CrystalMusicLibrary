import { IconCheck, IconSearch, IconTagFilled, IconTagPlus, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import ActionBarEntry from "../components/ActionBarEntry";
import apiBase from "../../APIbase";
import './TagEditor.css';
import { HexColorPicker } from "react-colorful";
const TagEditor = ({track}) => {
    const wrapperRef = useRef(null);
    const [searchbarFocused, setSearchbarFocused ] = useState(false);
    const [ proposedEntryToAdd, setProposedEntryToAdd ] = useState([{icon : () => <IconTagPlus/>, isAction : true}]);
    const [color, setColor] = useState("#aabbcc");
    const [ displayPicker, setDisplayPicker ] = useState(false);
    const pickerRef = useRef(null);
    const inputRef = useRef(null);
    const [ currentPickedTags, setCurrenPickedTags ] = useState([]);
    const [ editingTag, setEditingTag ] = useState(null);

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
                return {...tag, icon : () => <IconLabel/>, isAction : false}
            })
            proposed.push({icon : () => <IconTagPlus/>, isAction : true})
            setProposedEntryToAdd(proposed);})

    }
    const closeSearchBar = () => {
        setSearchbarFocused(false);
    }
    const handleActionBarEntryClick = (id) => {
        if(id.isAction){setEditingTag('new')}
    }

    useEffect(() => {
        const handleClickedOutside = (e) =>{   
            //needs to be first, because if displays, exisits and has priority on the search
            if(pickerRef.current && !pickerRef.current.contains(e.target)){
                if(e.target.closest('svg')?.id === 'color-button' ){return;}
                setDisplayPicker(false);
            }         
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                closeSearchBar();
                return
            }

        }

        document.addEventListener("mousedown", handleClickedOutside);
        document.addEventListener("touchstart", handleClickedOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickedOutside);
            document.removeEventListener("touchstart", handleClickedOutside);
        }
    },[]);
    const handleAddNewtag = () =>{
        const tagName = inputRef.current.value;

        if(tagName !== ''){
            if(editingTag === "new"){
                setCurrenPickedTags(prev => [...prev, {name: tagName, color : color}]);
            }
            //else we modify an exisiting one. Put all the infos in setEditingTag as an obj.
        } 
        setEditingTag(null);
    }
    return(
        <div className="albumWrapping-library-container">
            <div className="albumWrapping-library" style={{height : "400px", flexDirection : "column"}}>
                <h3>Editing tags for track {track.title}</h3>
                <div className="action-bar" style={{margin : "auto"}} ref={wrapperRef}>
                    <div className="action-bar-research" id="playlist-researchbar" >
                        <div className="action-bar-logo-container"><IconSearch className="action-bar-current-logo" /> </div>
                        <input
                            className="searchbar"
                            type="text"
                            id="playlist-searchbar"
                            onChange={fetchSearchResults}
                            placeholder="Search some tags.."
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
                {editingTag ?
                    <div className="edit-tag">
                        <IconTagPlus style={{paddingRight : "30px"}}/>
                        <input type="text" placeholder="Name your new tag." ref={inputRef}/>
                        <IconTagFilled id="color-button" color={color} onClick={() => {setDisplayPicker(!displayPicker); }}/>
                        { displayPicker && 
                            <div ref={pickerRef} className="edit-tag-picker" > {/*Need a div to supprot the ref*/}
                                <HexColorPicker  color={color} onChange={setColor} />
                            </div>}
                        <IconCheck onClick={handleAddNewtag}/>
                    </div> : null
                }
                {currentPickedTags.map((tag, index) => 
                    <div className="small-tag" style={{backgroundColor : tag.color}}><span>{tag.name}</span><IconX/></div>
                )}
                <button>
                    Apply
                </button>
            </div>
        </div>
    )
} 

export default TagEditor;