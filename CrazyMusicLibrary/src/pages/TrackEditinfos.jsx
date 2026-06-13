import { useEffect, useRef, useState } from "react";
import apiBase from "../../APIbase";

const LRCLIB = "https://lrclib.net/search/"
const TrackEditInfos= ({apply, track}) => {
    const [trackInfos, setTrackInfos] = useState(null);
    const formRef = useRef(null);
    useEffect(()=>{
        fetch(`${apiBase}/read-write/trackInfos/${track.id}`)
        .then(res=>res.json()).then(res=>{setTrackInfos(res)});
    },[]);

    useEffect(()=>{

    },[trackInfos])
    const handleApply = () =>{
        apply({title : formRef.current.songName.value,
                lyrics : formRef.current.lyrics.value
        }, track.id);
    }
    const openLrcLib = (e) =>{
         e.preventDefault();    
        const query = encodeURIComponent(`${trackInfos.artist} ${trackInfos.title}`);
        const url = `${LRCLIB}${query}`;
        window.open(url, '_blank').focus();
    }
    return (<div className="page-overlay-blur">
    
        {(trackInfos) ?  
        <div className="albumWrapping-library">
            <h3>Edit track</h3>
            <form ref={formRef} className="albumDetails" id='editArtistInfos'  >
                    <label htmlFor="songName">Song title</label>
                    <input type="text" id="songName" placeholder="Enter albusongm name" defaultValue={trackInfos.title}/>
                    <label htmlFor="lyrics">Lyrics</label>
                    <textarea id="lyrics" 
                     placeholder={`[0:12.05] She was drunk \n[0:13.01] \n[0:14.05] Oh-oh AH!`}
                     defaultValue={trackInfos.lyrics}
                     style={{minHeight: "200px"}}/>
                    <button className="roundButton go-back" onClick={openLrcLib}>Find lyrics online</button>

            </form>
            <button className="roundButton go-back" onClick={handleApply}>Apply</button>
            <button className="roundButton go-back" onClick={() => {apply(null, track.id)}}>Cancel</button>

        </div>: <div className="albumWrapping-library"><span>Loading</span></div>}
    </div>);
}

export default TrackEditInfos;
