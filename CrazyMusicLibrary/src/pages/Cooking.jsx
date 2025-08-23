import { IconCheck, IconInfoCircle, IconLabel, IconMusicCode, IconSalad, IconSaladFilled, IconSearch, IconTags, IconTagStarred, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import ActionBarEntry from "../components/ActionBarEntry.jsx";
import apiBase from "../../APIbase.js";
import '../components/TagEditor.css';
import './Cooking.css';
import _ from 'lodash'
import ButtonWithCallback from "../components/ButtonWithCallback.jsx";
import { useAudioPlayer } from "../GlobalAudioProvider.jsx";
import { useNotifications } from "../GlobalNotificationsProvider.jsx";
import TrackView from "../components/TrackView.jsx";
import { HexColorPicker } from "react-colorful";
import { asVerified, HSLToHex } from "../../lib.js";
import { TutorialKeys, TutorialWraper } from "./TutorialWraper.jsx";
import { useEventContext } from "../GlobalEventProvider.jsx";
const Cooking = () => {
    const wrapperRef = useRef(null);
    const searchInputRef = useRef(null);
    const [searchbarFocused, setSearchbarFocused ] = useState(false);
    const [ proposedEntryToAdd, setProposedEntryToAdd ] = useState([]);
    const { playAudioSalad, setSaladContext, saladContext, openTagWindow } = useAudioPlayer();
    const [ currentCookingContent, setCurrentCookingContent ] = useState([]);
    const [ mostUsedTags, setMostUsedTags ] = useState([]);
    const {addNotification, notifTypes } = useNotifications();
    const [ tracks, setTracks ] = useState([]);
    const [ savingNewSalad, setSavingNewSalad ] = useState(false);
    const [ displayPicker, setDisplayPicker] = useState(false);
    const colorPickerRef = useRef(null);
    const saladNameInputRef = useRef(null);
    const [ color, setColor ] = useState('#aabbcc');
    const [ allowsSave, setAllowSave ] = useState(true);
    const {subscribe} = useEventContext();
    const [tutoCookingFinished, setTutoCookingFinished] = useState(() => {
        const tuto = localStorage.getItem("CML_FinishedTutorials");
        if (!tuto) return false;
        const data = JSON.parse(tuto);
        return data.state[TutorialKeys.COOKING] || false;   

    });
    
    useEffect(() => {
        const handleClickedOutside = (e) =>{            
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                closeSearchBar();
            }}
        const callbackTutoFinished = () => {setTutoCookingFinished(true);}
        let unsubscribeTutorial = subscribe( `safe-finished-tutorial-${TutorialKeys.COOKING}`, callbackTutoFinished);

        const verify = asVerified(() => {
            if(currentCookingContent.length === 0 ){
                setCurrentCookingContent(saladContext || [])
            }
            fetch(`${apiBase}/read-write/mostUsedTags`, {
                method : "GET",
                credentials : "include"
            })
            .then(res => res.json())
            .then(data => {
                const proposed = data.map(tag => {
                    return {...tag, type : tag.total, typeElem: "tag", icon : () => <IconLabel color={tag.color}/>, tooltip : (num) => <span>{num}</span>}
                })
                setMostUsedTags(proposed);
                setProposedEntryToAdd(proposed)
            });
            document.addEventListener("mousedown", handleClickedOutside);
            document.addEventListener("touchstart", handleClickedOutside);

        });
        verify();
        return () => {
            unsubscribeTutorial();
            document.removeEventListener("mousedown", handleClickedOutside);
            document.removeEventListener("touchstart", handleClickedOutside);
        }; 
    },[]);

    
    const fetchSearchResults = (e) => {
        const input = e.target.value;
        if (input === "" || input.trim().length === 0) {setProposedEntryToAdd(mostUsedTags);return;} //return if empty or only white spaces
        fetch(`${apiBase}/read-write/search/${input}/tags,salads`, {
            method: "GET"})
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
            throw new Error("Error fetching search results");
        })
        .then((data) => {
            const proposed = [ 
                ...data.tags?.map(tag => {
                    return {...tag, typeElem : "tag", icon : () => <IconLabel color={tag.color}/>}}),
                ...data.salads?.map(salad => {
                    return {...salad, typeElem : "salad", icon : () => <IconSalad color={salad.color}/>}})];  
            console.log(proposed);
            setProposedEntryToAdd(proposed);
        });
    };
    const closeSearchBar = () => {
        setSearchbarFocused(false);
    }
    const removeTagFromTrack = (id) => {
        setCurrentCookingContent(prev => prev.filter(tag => tag.id !== id));
    }

    const handleActionBarEntryClick = (entry) => {
        closeSearchBar();
        console.log(entry);
        if(currentCookingContent.find(tag => tag.id === entry.id)){return}
        setCurrentCookingContent(prev => [...prev, entry]);
    }
    const playSalad = async () => {
        playAudioSalad(tracks.map(track => track.id))
        setSaladContext(currentCookingContent)
    }

    useEffect(() => {
        setSaladContext(currentCookingContent);
        //avoid refetching when we just created a
        // if(currentCookingContent.find(data => data.type ==="just_wrapped_salad")) {
        //     return
        // }
        
        if(currentCookingContent.length === 0 ){setTracks([]); setAllowSave(true); return}
        setAllowSave(currentCookingContent.findIndex(tag => tag.typeElem==="salad") === -1);

        const data = new FormData();
        data.append("tags", JSON.stringify(
            currentCookingContent.filter(elem => elem.typeElem === "tag").map(tag => tag.id)));
        data.append("salads", JSON.stringify(
            currentCookingContent.filter(elem => elem.typeElem === "salad").map(salad => salad.id)));

        fetch(`${apiBase}/read-write/getSalad`, {method : "POST", body : data})
        .then(res => res.json())
        .then(data => JSON.parse(data))
        .then(data => {
            setTracks(_.shuffle(data));
            console.log("New tracks received", data);
            if(data.length > 0){
                addNotification("Salad received! Enjoy..", notifTypes.SALAD);
            } else {
                addNotification("This salad is empty.. No tracks found.", notifTypes.SALAD);
            }
        })
    },[currentCookingContent])

    const saveSalad = async () =>{
        if( currentCookingContent.length === 0){return}
        setSavingNewSalad(true);
        setColor(`${HSLToHex(Math.random().toFixed(4)*360, 100.00, 70.80)}`)
    }

    const sendNewSalad = () => {
        if(!saladNameInputRef.current.value){return}
        setSavingNewSalad(false);
        if(currentCookingContent.find(tag => tag.typeElem === "salad")){return;}
        const data = new FormData();
        data.append("salad", JSON.stringify({
            name : saladNameInputRef.current.value,
            color : color,
            tags : currentCookingContent.map(tag => tag.id)
        }));

        fetch(`${apiBase}/read-write/newSalad`, {
            method: "POST",
            credentials: 'include',
            body : data
        } )
        .then(res => res.json())
        .then(data => {
            addNotification("Salad saved!", notifTypes.SUCCESS);
            setCurrentCookingContent([data])
        })
    }

    const clickedTrack = (id) => {
 
        playAudioSalad(tracks.map(track => track.id), id);
        
    }

    const onSearchbarFocused = () =>{
        setSearchbarFocused(true); 
        if (searchInputRef.current.value !== '')return
  
        
    }
    
    return(<>
    <IconInfoCircle className="info-button" id="cooking-info" onClick={()=>{setTutoCookingFinished(false)}}/>
    {tutoCookingFinished ? 

        <div className="cooking-div" >
            <h2>Here select some tags and play the music!</h2>
            <div className="cooking-header">
            <div className="action-bar" style={{margin : "auto"}} ref={wrapperRef}>
                <div className="action-bar-research" id="playlist-researchbar" style={{zIndex : "2"}} >
                    <div className="action-bar-logo-container"><IconSearch className="action-bar-current-logo" /> </div>
                    <input
                        className="searchbar"
                        type="text"
                        id="playlist-searchbar"
                        onChange={fetchSearchResults}
                        placeholder="Search some tags or salads.."
                        ref={searchInputRef}
                        onFocus={onSearchbarFocused}/>
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
            <button className="open-tags-edit" onClick={openTagWindow}>
                    <IconTags/>
                </button>
            </div>
            <div className="cooking-selection">
                <div className="cooking-actions">
                <ButtonWithCallback text={'Play salad'} icon={<IconMusicCode/>} onClick={playSalad}/>
                { allowsSave &&
                    <ButtonWithCallback text={'Save salad'} icon={<IconTagStarred />} onClick={saveSalad}/>
                }
                </div>
                <div className="cooking-tags" style={{marginBottom : "30px"}}>
                    {currentCookingContent.map(tag =>                     
                        <div key={tag.id} className="small-tag" data-prefix={tag.typeElem === "salad"} style={{backgroundColor : tag.color}}>
                            {tag.typeElem === "salad" && <IconSalad data-prefix='true'/>}
                            <span>{tag.name}</span> 
                            <IconX onClick={() => {removeTagFromTrack(tag.id)}}/>
                        </div>)}
                </div>
                <div className="track-list">
                    {tracks.map((track, index) => (
                        <TrackView key={track.id} index={index} isSalad={clickedTrack} track={track} playIconId={"salad"} showCover={true}/>))}
                </div>
            </div>
            {savingNewSalad ?
            <div className="edit-tag" style={{left: 'calc(50% - 170px)', margin : 'auto'}}>
                <IconX style={{cursor: "pointer"}} onClick={() => {setSavingNewSalad(false)}}/>
                <input type="text" placeholder="Name your new salad." ref={saladNameInputRef}/>
                <IconSaladFilled style={{cursor: "pointer"}} id="color-button" color={color} onClick={() => {setDisplayPicker(!displayPicker); }}/>
                { displayPicker && 
                    <div ref={colorPickerRef} className="edit-tag-picker" > {/*Need a div to support the ref*/}
                        <HexColorPicker  color={color} onChange={setColor} />
                    </div>}
                <IconCheck onClick={sendNewSalad} style={{cursor: "pointer"}}/>
            </div> : null}
        </div>

    : <TutorialWraper tutorialKey={TutorialKeys.COOKING}/>    }
    </>)
}

export default Cooking;