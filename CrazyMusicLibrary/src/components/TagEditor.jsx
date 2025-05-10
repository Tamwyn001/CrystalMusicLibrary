import { IconCheck, IconLabel, IconSearch, IconTagFilled, IconTagPlus, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import ActionBarEntry from "../components/ActionBarEntry";
import apiBase from "../../APIbase";
import './TagEditor.css';
import { HexColorPicker } from "react-colorful";
import { HSLToHex } from "../../lib";
import {v4 as uuidv4} from 'uuid'

const defaultTagEntry = {name: "Create a new tag", icon : () => <IconTagPlus/>, isAction : true};
const TagEditor = ({track, apply}) => {
    const wrapperRef = useRef(null);
    const [searchbarFocused, setSearchbarFocused ] = useState(false);
    const [ proposedEntryToAdd, setProposedEntryToAdd ] = useState([defaultTagEntry]);
    const [color, setColor] = useState("#aabbcc");
    const [ displayPicker, setDisplayPicker ] = useState(false);
    const pickerRef = useRef(null);
    const inputRef = useRef(null);
    const [ currentPickedTags, setCurrenPickedTags ] = useState([]);
    const [ editingTag, setEditingTag ] = useState(null);
    const [ currentSearch, setCurrentSearch ] = useState(null);
    const [ removedTags, setRemovedTags ] = useState([]); //from the ones that currently exist

    const searchbarRef = useRef();
    const fetchSearchResults = (e) => {
        const input = e.target.value;
        setCurrentSearch(input);
        if (input === "" || input.trim().length === 0) {setProposedEntryToAdd([defaultTagEntry]);return;} //return if empty or only white spaces
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
                return {...tag, icon : () => <IconLabel color={tag.color}/>, isAction : false}
            })
            const addnew = {name : `${defaultTagEntry.name}: ${input}`, icon : defaultTagEntry.icon, isAction : defaultTagEntry.isAction} 
            proposed.splice(0, 0, addnew);
            setProposedEntryToAdd(proposed);
        })
    };

    const closeSearchBar = () => {
        setSearchbarFocused(false);
    };

    const handleActionBarEntryClick = (id) => {
        closeSearchBar();
        if(id.isAction){
            setEditingTag('new');
            setColor(`${HSLToHex(Math.random().toFixed(4)*360, 100.00, 70.80)}`)
            return
        }
        if(currentPickedTags.find(tag => tag.id === id.id)){return}
        setRemovedTags(prev => prev.filter(tagId => tagId !== id.id)); // cancel the removal if we readd it.
        setCurrenPickedTags(prev => [...prev, id]);
    };

    useEffect(() => {
        if(editingTag === "new"){inputRef.current.focus(); inputRef.current.value = currentSearch || ''; searchbarRef.current.value=""}
    },[editingTag])
    
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

        fetch(`${apiBase}/read-write/trackTags/${track.id}`, {method: "GET"})
        .then(res => res.json())
        .then(data => {setCurrenPickedTags(data)})
        return () => {
            document.removeEventListener("mousedown", handleClickedOutside);
            document.removeEventListener("touchstart", handleClickedOutside);
        }
    },[]);

    const handleAddNewtag = () =>{
        const tagName = inputRef.current.value;

        if(tagName !== ''){
            if(editingTag === "new"){
                setCurrenPickedTags(prev => [...prev, {name: tagName, color : color, id: uuidv4(), isNew : true}]);

            }
            //else we modify an exisiting one. Put all the infos in setEditingTag as an obj.
          
        } 
        setEditingTag(null);
    }

    const removeTagFromTrack = (isNew, id) => {
        const newTags = currentPickedTags.filter(tag => !(tag.isNew === isNew && tag.id === id));
        setCurrenPickedTags( newTags );
        if(!isNew){
            setRemovedTags(prev => [...prev, id]);
        }
    }

    return(
        <div className="albumWrapping-library-container">
            <div className="albumWrapping-library" style={{height : "400px", flexDirection : "column"}}>
                <IconX className="buttonRound closeOverlay" onClick={() => {apply(null);}} />

                <h3>Editing tags for track {track.title}</h3>
                <div className="action-bar" style={{margin : "10px auto"}} ref={wrapperRef}>
                    <div className="action-bar-research" id="playlist-researchbar" >
                        <div className="action-bar-logo-container"><IconSearch className="action-bar-current-logo" /> </div>
                        <input
                            className="searchbar"
                            type="text"
                            id="playlist-searchbar"
                            onChange={fetchSearchResults}
                            placeholder="Search some tags.."
                            ref={searchbarRef}
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
                
                <div className="track-tags-div">
                {currentPickedTags.map((tag, index) => 
                    <div key={`${tag.isNew}-${tag.id}`} className="small-tag" style={{backgroundColor : tag.color}}>
                        <span>{tag.name}</span> <IconX onClick={() => {removeTagFromTrack(tag.isNew, tag.id)}}/>
                    </div>
                )}
                </div>
                <button style={{marginTop : "auto"}} onClick={() => {apply({current : currentPickedTags, deleted: removedTags}, track.id);}}>
                    Apply
                </button>
            </div>
        </div>
    )
} 

export default TagEditor;