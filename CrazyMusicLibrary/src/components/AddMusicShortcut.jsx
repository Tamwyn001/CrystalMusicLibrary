import {useEventContext} from '../GlobalEventProvider.jsx'
export const AddMusicShortcut = () => {
    const { emit } = useEventContext();
    const emitAddMusic = () => {
        emit('openAddMusic');
    };

    return (
        <div className="add-music-shortcut">
            Welcome to the Crystal Music Library!
            <button onClick={emitAddMusic}>
                <h3>Add music</h3>
            </button>
        </div>
    )
};