import { useState } from "react";
import TwoOptionSwitch from "../TwoOptionSwitch";
import ButtonWithCallback from "../ButtonWithCallback";
import { IconFileAi, IconFilePlus, IconLinkPlus } from "@tabler/icons-react";

const MusicSource= ({fromFile, setFromFile, tracksSelected, initMetadataFetching }) =>{
    const [musicDetected, setMusicDetected ] = useState(false);
    const [URL, setURL] = useState("");
    const handleFileChange = (e) => {
        setMusicDetected(true)
        if (e.target.files) {
            console.log('New tracks')
            tracksSelected(Array.from(e.target.files));
            e.target.files = null; // Reset the input value
        }
    };
    const handleURLChanged = (e) =>{
        setURL(e.target.value);
    }
    return (
        <div className="addMusicSource">
            <div className="add-audio-source-selection">
                <p>Select the source: </p>
                <TwoOptionSwitch currentActive={fromFile ? 0 : 1} onClick={(v) => {setFromFile(v == 0)}} data={["From file", "From URL"]}/>
            </div>
            {fromFile ? (
                <>
                <p>Select files from a local storage.</p>
                <div className="add-music-input">
                    <label for="files" className="file-select">
                        <IconFilePlus/>
                        <span>Select file</span>
                        </label>
                    <input id="files" multiple type="file" accept="audio/*" onChange={handleFileChange} />
                </div>
                </>
            ):(
                <>
                <p>Link to a radio steam.</p>
                <div className="add-music-input">
                   
                    <input type="text" placeholder="Enter URL" onChange={handleURLChanged}/>
                    <ButtonWithCallback onClick={async () => {initMetadataFetching(URL)}} text={"Resolve"} icon={<IconLinkPlus/>}/>
                </div>
                </>
            ) }
            {(musicDetected) && <p>Hold a sec'.. The metadata fetch is about to beggin.</p>}
        </div>
    )
}

export default MusicSource