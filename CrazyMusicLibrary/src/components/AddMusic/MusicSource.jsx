import { useState } from "react";

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
            <p>Select the source.</p>
            <nav className="addMusicNav">
                <a onClick={() =>setFromFile(true)}>From file</a>
                <a onClick={()=>setFromFile(false)}>From URL</a>
            </nav>
            {fromFile ? (
                <div className="addMusicInput">
                    <input multiple type="file" accept="audio/*" onChange={handleFileChange} />
                </div>
            ):(
                <div className="addMusicInput">
                    <input type="text" placeholder="Enter URL" onChange={handleURLChanged}/>
                    <button className="buttonRound" onClick={() => {initMetadataFetching(URL)}}>Add</button>
                </div>
            ) }
            {(musicDetected) && <p>Hold a sec'.. The metadata fetch is about to beggin.</p>}
        </div>
    )
}

export default MusicSource