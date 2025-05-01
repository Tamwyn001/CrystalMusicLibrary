const MusicSource= ({fromFile, setFromFile, tracksSelected, initMetadataFetching }) =>{

    const handleFileChange = (e) => {
        if (e.target.files) {
            console.log('New tracks')
            tracksSelected(e.target.files);
            e.target.files = null; // Reset the input value
        }
    };
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
                    <input type="text" placeholder="Enter URL" />
                    <button className="buttonRound" onClick={initMetadataFetching}>Add</button>
                </div>
            ) }
        </div>
    )
}

export default MusicSource