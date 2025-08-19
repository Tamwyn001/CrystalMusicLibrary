import {useEventContext} from '../GlobalEventProvider.jsx'
import {IconMusicPlus} from "@tabler/icons-react";
export const AddMusicShortcut = () => {
    const { emit } = useEventContext();
    const emitAddMusic = () => {
        emit('openAddMusic');
    };

    return (
        <div className="add-music-shortcut">
            <h2>Welcome to the Crystal Music Library !</h2>
            <button onClick={emitAddMusic} 
            style={{display : 'flex', flexDirection: 'row', alignItems: 'center', gap : '15px', margin: "auto"}}>
                <IconMusicPlus/>
                <h3 style={{margin : '2px'}}>Add music</h3>
            </button>
        </div>
    )
};