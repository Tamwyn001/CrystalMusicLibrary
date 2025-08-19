import { memo, useState } from "react";
import ActiveIndex from "../components/ActiveIndex.jsx";
import CML_logo from '../components/CML_logo.jsx';
import { IconEdit } from "@tabler/icons-react";
import { useGlobalActionBar } from "../GlobalActionBar.jsx";
import { TutorialKeys } from "./TutorialWraper.jsx";

const PageOpenAlbum = memo(({payload})=>{
    return <div className="tutorial-content">
        <span>Pick an album:</span>
        <div id="tuto-genre-albums-container">
            <div className="tuto-genre-0-album album-card" onClick={() =>{payload(1)}}>
                <CML_logo className="tuto-genre-logo"/>
                <div className="tuto-genre-0-song-skeleton"/>
                <div className="tuto-genre-0-song-skeleton" data-type="artist"/>
            </div>
            <div className="tuto-genre-0-album album-card" onClick={() =>{payload(1)}}>
                <CML_logo className="tuto-genre-logo"/>
                <div className="tuto-genre-0-song-skeleton"/>
                <div className="tuto-genre-0-song-skeleton" data-type="artist"/>
            </div>
        </div>
    </div>
});
const PageOpenAlbumEdit = memo(({payload})=>{
    return <div className="tutorial-content">
        <span>Edit the desired album:</span>
        <div id="tuto-genre-0-lib">
            <CML_logo id="tuto-genre-logo"/>
            <div id="tuto-genre-0-btn-song">
                <div id="tuto-genre-0-header">
                    <button className="placeholder-tuto-genre-btn"/>
                    <button className="placeholder-tuto-genre-btn"/>
                    <button className="tuto-target"  
                        onClick={() =>{payload(2)}}>
                        <IconEdit/>
                    </button>
                </div>
                <div className="tuto-genre-0-song-skeleton"/>
                <div className="tuto-genre-0-song-skeleton"/>
                <div className="tuto-genre-0-song-skeleton"/>

            </div>
        </div>
    </div>
});

const PageAlbumEdit = memo(({payload})=>{
    return <div className="tutorial-content">
        <span>Change the genre:</span>
        <div id="tuto-genre-1-lib">
            <div id="tuto-genre-1-logo-btn">
                <CML_logo id="tuto-genre-logo"/>
                <button className="tuto-target" onClick={payload}>
                    Got it!
                </button>
            </div>
            <div id="tuto-genre-0-btn-song">
                <div className="tuto-genre-1-title-skeleton"/>
                <div className="tuto-genre-1-input-skeleton"/>
                <div className="tuto-genre-1-title-skeleton"/>

                <div className="tuto-genre-1-input-skeleton"/>
                <div className="tuto-genre-1-title-skeleton" data-target={true}>
                <span>Genre</span>
                </div>
                <div className="tuto-genre-1-input-skeleton tuto-target" data-target={true}>
                    <span id="animated-write-span">Rock, Breakcore, Soundtrack, ..</span>
                    <div className="blinking-cursor"/>
                </div>
            </div>

        </div>

    </div>
});
const pages = [PageOpenAlbum, PageOpenAlbumEdit, PageAlbumEdit];
const GenresTuto = memo(() => {
    const {onTutoialFinished} = useGlobalActionBar();
    const [page, setPage] = useState(0);
    const ResolvedPage = pages[page] || (() => <div>This tutorial page does not exisit.</div>);
    const close = () => {
        onTutoialFinished(TutorialKeys.GENRES);
    };
    const payload = [setPage,setPage, close];

    return <div className="tutorial-page">
        <h3>Add genre to albums</h3>
        <ActiveIndex context={{name:"tutorial", length : 3}} active={page} setActive={setPage}/>
        <ResolvedPage payload={payload[page]}/>
    </div>
});

export default GenresTuto;