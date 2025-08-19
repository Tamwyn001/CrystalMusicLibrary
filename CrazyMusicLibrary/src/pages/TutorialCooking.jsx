import { memo, useState } from "react";
import ActiveIndex from "../components/ActiveIndex.jsx";
import CML_logo from '../components/CML_logo.jsx';
import { IconDots, IconEdit, IconLabel, IconSearch, IconX } from "@tabler/icons-react";
import { useGlobalActionBar } from "../GlobalActionBar.jsx";
import { TutorialKeys } from "./TutorialWraper.jsx";

const PageOpenDropdown = memo(({payload})=>{
    const [dropOpened, setDropOpened]  = useState(false)
    return <div className="tutorial-content">
        <span>Open a song's dropdown</span>
        <div id="tuto-0-cooking-container">
            <CML_logo className="tuto-genre-logo"/>
            <div id="tuto-cooking-songs-container">
                <div className="tuto-cooking-0-song-skeleton" data-target={true}>
                    <IconDots id="tuto-cooking-dots" onClick={()=>{setDropOpened(!dropOpened)}}/>
                    {dropOpened && 
                    <div id="tuto-0-cooking-dropdown">
                         <div className="tuto-cooking-0-action-skeleton track-action-entry" 
                        data-target="true"
                        onClick={()=>{payload(1)}}>
                         <span>Edit tags</span> <IconLabel/>
                         </div>
                         <div className="tuto-cooking-0-action-skeleton"/>
                    </div>}
                </div>
                <div className="tuto-cooking-0-song-skeleton"/>
                <div className="tuto-cooking-0-song-skeleton"/>

            </div>
        </div>
    </div>
});
const PageSongTags = memo(({payload})=>{
    return <div className="tutorial-content">
        <span>Here you can remove and add tags:</span>

            <div id="tuto-tags-1">
                <div className="tuto-search-skeleton">
                    <IconSearch/>
                    <span id="animated-write-span">140BPM, roses, gaming, 2010s</span>
                    <div className="blinking-cursor"/>
                </div>
                <div id="tuto-tags">
                    <div className="small-tag" >Evening<IconX/></div>
                    <div className="small-tag" >Chill<IconX/></div>
                    <div className="small-tag">Friends<IconX/></div>
                    <button className="tuto-target"  
                        onClick={() =>{payload(2)}}>
                        Got it!
                    </button>
                </div>
            </div>
        </div>

});
const PageCooking = memo(({payload})=>{
    return <div className="tutorial-content">
        <span>Cooking lets you play all the tracks mataching the tags:</span>
            <div id="tuto-tags-salad">
                <div id="tuto-tags">
                    <div className="placeholder-tuto-tag" style={{"--color" : "#3c9eff"}}/>
                    <div className="placeholder-tuto-tag" style={{"--color" : "#a79cf5"}}/>
                </div>
            </div>
                <div id="tuto-song-list">
                    <div className="tuto-tag-song-skeleton">
                        <div className="placeholder-tuto-tag-circle" style={{"--color" : "#3c9eff"}}/>
                    </div>
                    <div className="tuto-tag-song-skeleton">
                    <div className="placeholder-tuto-tag-circle" style={{"--color" : "#a79cf5"}}/>
                    </div>
                    <div className="tuto-tag-song-skeleton">
                    <div className="placeholder-tuto-tag-circle" style={{"--color" : "#3c9eff"}}/>
                    <div className="placeholder-tuto-tag-circle" style={{"--color" : "#a79cf5"}}/>


                    </div>
                </div>
                <button className="tuto-target"  
                        onClick={payload}>
                        Got it!
                </button>
        </div>

});

const pages = [PageOpenDropdown, PageSongTags, PageCooking];
const CookingTuto = memo(() => {
    const {onTutoialFinished} = useGlobalActionBar();
    const [page, setPage] = useState(0);
    const ResolvedPage = pages[page] || (() => <div>This tutorial page does not exisit.</div>);
    const close = () => {
        onTutoialFinished(TutorialKeys.COOKING);
    };
    const payload = [setPage,setPage, close];

    return <div className="tutorial-page">
        <h3>Manage tags and cook salads</h3>
        <ActiveIndex context={{name:"tutorial", length : 3}} active={page} setActive={setPage}/>
        <ResolvedPage payload={payload[page]}/>
    </div>
});

export default CookingTuto;