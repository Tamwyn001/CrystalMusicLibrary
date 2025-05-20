import { IconCancel, IconCheck, IconPencil, IconSalad, IconTag, IconTagFilled, IconTags, IconTrash, IconX } from '@tabler/icons-react';
import { useAudioPlayer } from '../GlobalAudioProvider'
import './EditTagsWindow.css'
import ButtonWithCallback from './ButtonWithCallback';
import { useEffect, useRef, useState } from 'react';
import apiBase from '../../APIbase';
import { method } from 'lodash';
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
    const [ editingTag, setEditingTag ] = useState(null);
    const renameTagInputRef = useRef(null);
    const colorPickerRef = useRef(null);
    const { addNotification, notifTypes } = useNotifications();
    const [ toDeleteElement, setToDeleteElement ] = useState(null);
    useEffect(() => {
        refetchTags();
    },[])

    const refetchTags = () => {
        fetch(`${apiBase}/read-write/getAllUserTags`, {
            method : "GET",
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setUserTags(data);
            console.log(data);
        })
    }

    const openTagEdit = (tag) =>{
        setEditingTag({type : "tag", ...tag})
        setColor(tag.color);
    }
    const handleModifyTag = () =>{
        const tagInfo = {id: editingTag.id, name : renameTagInputRef.current.value, color: color};
        const data = new FormData();
        data.append("tag", JSON.stringify(tagInfo));
        fetch(`${apiBase}/read-write/applyTagModifications`, {
            method : "POST",
            credentials : "include",
            body : data
        }).then(res => res.json())
        .then(data => {
            refetchTags();
            addNotification("Tag updated.", notifTypes.SUCCESS);
        })
        setEditingTag(null);
    }


    const deleteElem = () =>{
        
        fetch(`${apiBase}/read-write/delete/${toDeleteElement.type}/${toDeleteElement.id}`, {
            method : "DELETE",
            credentials : "include"
        }).then(res => res.json())
        .then(data => {
            refetchTags();
            setEditingTag(null);
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
                    focusedWindow === 0 ? 
                    <List
                    className="albumTrackList"
                    height={250}
                    itemCount={userTags.length}
                    itemSize={35}
                    width={"100%"}
                    >
                        {({ index, style }) => (
                            <div key={index} style={style} className="album-wrapping-track">
                                <div className='tag-color' style ={{backgroundColor : userTags[index].color}}/>
                            <span>{userTags[index].name}</span>
                            <IconPencil className="trackIcon" onClick={() => {openTagEdit(userTags[index])}}/>
                        </div>)}
                    </List>
                    
                    :
                    <List
                    className="albumTrackList"
                    height={250}
                    itemCount={userSalads.length}
                    itemSize={35}
                    width={"100%"}
                    >
                        {({ index, style }) => (
                            <div key={index} style={style} className="album-wrapping-track">
                            <div className='tag-color' style ={{backgroundColor : userSalads[index].color}}/>
                            <span>{userSalads[index].title}</span>
                            <IconPencil className="trackIcon" onClick={() => {openTrackRemap(userSalads[index])}}/>
                        </div>)}
                    </List>
                }
                {editingTag ?
                    <div className="edit-tag">
                        <IconX style={{cursor: "pointer"}} onClick={() => {setEditingTag(null)}}/>
                        <input type="text" placeholder="Name your new tag." ref={renameTagInputRef} defaultValue={editingTag.name}/>
                        <IconTagFilled id="color-button" color={color} onClick={() => {setDisplayPicker(!displayPicker); }}/>
                        { displayPicker && 
                            <div ref={colorPickerRef} className="edit-tag-picker" > {/*Need a div to supprot the ref*/}
                                <HexColorPicker  color={color} onChange={setColor} />
                            </div>}
                        <IconCheck onClick={handleModifyTag} style={{cursor: "pointer"}}/>
                        <IconTrash onClick={() => {setToDeleteElement({type : "tag",  ...editingTag})}}/>
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