import { IconCancel, IconCheck, IconPencil, IconSalad, IconTag, IconTagFilled, IconTags, IconTrash, IconX } from '@tabler/icons-react';
import { useAudioPlayer } from '../GlobalAudioProvider'
import './EditTagsWindow.css'
import ButtonWithCallback from './ButtonWithCallback';
import { useEffect, useRef, useState } from 'react';
import apiBase from '../../APIbase';
import { FixedSizeList as List} from 'react-window';
import { HexColorPicker } from 'react-colorful';
import { useNotifications } from '../GlobalNotificationsProvider';
const EditTagsWindow = () => {
    const { closeTagWindow } = useAudioPlayer();
    const [ focusedWindow, setFocusedWindow ] = useState(0);
    const [ userTags, setUserTags ] = useState([]);
    const [ userSalads, setUserSalads ] = useState([]);
    const [ displayPicker, setDisplayPicker ] = useState(false);
    const [color, setColor] = useState("#aabbcc");
    const [ editingElem, setEditingElem ] = useState(null);
    const renameTagInputRef = useRef(null);
    const colorPickerRef = useRef(null);
    const { addNotification, notifTypes } = useNotifications();
    const [ toDeleteElement, setToDeleteElement ] = useState(null);
    useEffect(() => {
        refetchTags();
        refreshSalads();
    },[])

    const refetchTags = () => {
        fetch(`${apiBase}/read-write/getAllUserTags`, {
            method : "GET",
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setUserTags(data);
        })
    }

    const refreshSalads = () => {
        fetch(`${apiBase}/read-write/getAllUserSalads`, {
            method : "GET",
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setUserSalads(data);
        })
    }

    const openElemEdit = (elem) =>{
        setEditingElem(elem)
        setColor(elem.color);
    }
    const handleModifyElem = () =>{
        const elemInfo = {id: editingElem.id, name : renameTagInputRef.current.value, color: color};
        const data = new FormData();
        data.append(focusedWindow === 0 ? "tag": "salad", JSON.stringify(elemInfo));
        fetch(`${apiBase}/read-write/${focusedWindow === 0 ? "applyTagModifications" : "applySaladModifications"}`, {
            method : "POST",
            credentials : "include",
            body : data
        }).then(res => res.json())
        .then(data => {
            if(focusedWindow === 0 ){
                refetchTags();
            }else{
                refreshSalads();
            }
            addNotification("Tag updated.", notifTypes.SUCCESS);
        })
        setEditingElem(null);
    }


    const deleteElem = () =>{
        
        fetch(`${apiBase}/read-write/delete/${toDeleteElement.type}/${toDeleteElement.id}`, {
            method : "DELETE",
            credentials : "include"
        }).then(res => res.json())
        .then(data => {
            if(focusedWindow === 0 ){
                refetchTags();
            }else{
                refreshSalads();
            }
            setEditingElem(null);
            setToDeleteElement(null);
            addNotification("Tag deleted.", notifTypes.SUCCESS);
        })
    }

    return(
        <div className="albumWrapping-library-container">
            <div className="tag-edtior-container">
            <IconX className="buttonRound closeOverlay" onClick={closeTagWindow}/>
            <div className="cooking-selection" style={{marginTop : "40px"}}>
                <div className="cooking-actions" >
                    <ButtonWithCallback text={'Edit tags'} icon={<IconTag/>} onClick={async () => {setFocusedWindow(0)}}/>
                    <ButtonWithCallback text={'Edit salads'} icon={<IconSalad />} onClick={async () => {setFocusedWindow(1)}}/>
                </div>
                <div className='edit-tags-content'>
                {
                    
                    <List
                    className="albumTrackList"
                    height={250}
                    itemCount={focusedWindow === 0 ? userTags.length : userSalads.length}
                    itemSize={35}
                    width={"100%"}
                    >
                    {({ index, style }) => (
                        <div key={index} style={style} className="album-wrapping-track">
                            <div className='tag-color' style ={{
                                backgroundColor : focusedWindow === 0 ? userTags[index].color : userSalads[index].color}}/>
                        <span>{focusedWindow === 0 ? userTags[index].name : userSalads[index].name}</span>
                        <IconPencil className="trackIcon" onClick={() => {openElemEdit(
                             focusedWindow === 0 ? {...userTags[index], type : "tag"} : {...userSalads[index] , type : "salad"})}}/>
                    </div>)}
                    </List>
                    
        
                }
                {editingElem ?
                    <div className="edit-tag" style={{left: '-20px', margin : 'auto'}}>
                        <IconX style={{cursor: "pointer"}} onClick={() => {setEditingElem(null)}}/>
                        <input type="text" placeholder="Name your new tag." ref={renameTagInputRef} defaultValue={editingElem.name}/>
                        <IconTagFilled style={{cursor: "pointer"}} id="color-button" color={color} onClick={() => {setDisplayPicker(!displayPicker); }}/>
                        { displayPicker && 
                            <div ref={colorPickerRef} className="edit-tag-picker" > {/*Need a div to supprot the ref*/}
                                <HexColorPicker  color={color} onChange={setColor} />
                            </div>}
                        <IconCheck onClick={handleModifyElem} style={{cursor: "pointer"}}/>
                        <IconTrash style={{cursor: "pointer"}} onClick={() => {setToDeleteElement(editingElem)}}/>
                    </div> : null}
                { toDeleteElement ? 
                <div className='deletion-confirmation'>
                    <div className='tag-color' style ={{backgroundColor : toDeleteElement.color, width : "50px"}}/>
                    <p>Confirm deletion of the {toDeleteElement.type} {toDeleteElement.name}?</p>
                    <div>
                        <button onClick={() => {setToDeleteElement(null)}}>
                            <IconCancel/>
                        </button>
                        <button onClick={() => {deleteElem()}}>
                            <IconCheck/>
                        </button>
                    </div>
                </div> : null

                }
            </div>
                
            </div>
            </div>
        </div>
    )
}

export default EditTagsWindow