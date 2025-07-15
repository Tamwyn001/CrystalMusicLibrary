import { useEffect, useRef, useState } from "react";
import Loading from "../components/Loading";
import TrackView from "../components/TrackView";
import { useNavigate, useParams } from "react-router-dom";
import {IconAddressBook, IconArrowBackUp, IconArrowsShuffle, IconChartScatter3d, IconChevronRight, IconCodePlus, IconEdit, IconFilterStar, IconFlagPlus, IconFolderPlus, IconMusicPlus, IconPlaylistAdd, IconSearch} from "@tabler/icons-react";
import "./AlbumView.css";

import apiBase from "../../APIbase";
import CML_logo from "../components/CML_logo";
import ButtonWithCallback from "../components/ButtonWithCallback";
import { useAudioPlayer } from "../GlobalAudioProvider";
import { FixedSizeList as List } from "react-window";
import ActionBarEntry from "../components/ActionBarEntry";
import { useNotifications } from "../GlobalNotificationsProvider";


const AlbumView = ({isPlaylist = false}) => {
    //the actual album data
    const [album, setAlbum] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [genres, setGenres] = useState([]);
    const [artists, setArtists] = useState([]);
    const [currentPlayIcon, setCurrentPlayIcon] = useState(0);
    //the id for the REST API is the albumId in the URL
    const { addContainerToQueue, playContainerSuffle, editAlbum, editPlaylist, linkNewContainer, getNextSongsFromAlbum } = useAudioPlayer();
    const wrapperRef = useRef(null) ;
    const navigate = useNavigate();
    const [ proposedEntryToAdd, setProposedEntryToAdd ] = useState([]);
    const albumId = (isPlaylist) ? useParams().playlistId : useParams().albumId ;
    const [searchbarFocused, setSearchbarFocused] = useState(null);
    const searchInputRef = useRef(null);
    const { notifTypes, addNotification} = useNotifications();
    const [isFavPlaylist, setIsFavPlaylist] = useState(false);
    const [ showOnlyFavs, setShowOnlyFavs ] = useState(false);
    const [ favFilterAvaliable, setFavFilterAvaliable ] = useState(false);
    useEffect(() => {
            refetchAlbum();   
            
        }, [albumId, showOnlyFavs]);
    useEffect(() => {
        linkNewContainer({id: albumId, type: (isPlaylist) ? "playlist" : "album", favPlaylist : isFavPlaylist}, refetchAlbum)     
    },[isFavPlaylist])

    const refetchAlbum = () => {
        fetch(`${apiBase}/read-write/${ (isPlaylist) ? "playlist" : "album"}/${albumId}`, {
            method: "GET",
            credentials: "include"
        })
        .then(res => {
            if (!res.ok) {throw new Error("Network response was not ok");}
            return res.json();
        })
        .then(data => {
            setCurrentPlayIcon(Math.floor(Math.random() * 3));
            const tracks = data.tracks.filter(track => {
                    if(!favFilterAvaliable && track.is_favorite === 1) {setFavFilterAvaliable(true);}
                    return showOnlyFavs ? track.is_favorite === 1 : true});
            if(isPlaylist){
                setAlbum(data.playlistInfos);
                setTracks(tracks);
                setArtists([data.owner, ...data.collaborators]);
                setIsFavPlaylist(data.isFavPlaylist)
                return;
            }
            setAlbum(data.albumInfos);

            setTracks(tracks);
            setGenres(data.genres);
            setArtists(data.artists);
            setIsFavPlaylist(false); //triggers container for the AudioContext
           
        })
    };

    const handleAddToQueue = async () => {
        const res = await addContainerToQueue(albumId, isPlaylist ? "playlist" : "album", showOnlyFavs);
        return res;
    }
    const handleShuffle = async () => {
        playContainerSuffle(albumId, isPlaylist ? "playlist" : "album", showOnlyFavs);
    }
    const openEdit = () => {
        if(isPlaylist){
            editPlaylist(albumId)
            return;
        }       
        editAlbum(albumId);
    };

    const playlistAddType = {
        TRACK : "track",
        ALBUM : "album",
        ARTIST : "artist",
        PLAYLIST : "playlist",
        GENRE : "genre"
    }

    const getTooltipOnSearchResult = (type) => {
        switch (type) {
            case 'track':
                return <IconMusicPlus className="action-bar-entry-tooltip-logo" />;
            case 'album':
                return <div className="action-tooltip-div"> <span style={{margin: "0"}}>Add album</span> <IconFolderPlus className="action-bar-entry-tooltip-logo"/></div>;
            case 'artist':
                return <div className="action-tooltip-div"> <span style={{margin: "0"}}>Add artist's discography</span> <IconAddressBook className="action-bar-entry-tooltip-logo"/></div>;
            case 'playlist':
                return <div className="action-tooltip-div"> <span style={{margin: "0"}}>Add entire playlist</span> <IconPlaylistAdd className="action-bar-entry-tooltip-logo"/></div>;
            case 'genre':
                return <div className="action-tooltip-div"> <span style={{margin: "0"}}>Add entire genre</span> <IconFlagPlus className="action-bar-entry-tooltip-logo"/></div>;
            default:
                return null
            }
    };

    const fetchSearchResults = (e) => {
        const input = e.target.value;

        if (input === "" || input.trim().length === 0) {setProposedEntryToAdd([]);return;} //return if empty or only white spaces
        console.log(`${apiBase}/read-write/search/${input}`);
        fetch(`${apiBase}/read-write/search/${input}`, {
            method: "GET"})
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
            throw new Error("Error fetching search results");
        })
        .then((data) => {
            const remappedTrack = [...data.tracks?.map(track => {return({type : "track", ...track})}),
                                   ...data.albums?.map(track => {return({type : "album", ...track})}),
                                   ...data.artists?.map(track => {return({type : "artist", ...track})}),
                                   ...data.genres?.map(track => {return({type : "genre", ...track})}),
                                   ...data.playlists?.map(track => {return({type : "playlist", ...track})})
                                        .filter(({id}) => id !== albumId)]
                .map((item) => { 
                    const fileName = item.path;
                    const {trackPath, ...itemSorted} = item;
                    return {icon : () => {return ((fileName) ? <img className="action-bar-entry-logo" 
                            src={`${apiBase}/${item.type === 'artist' ? "artist" : "covers"}/${fileName}`} 
                             alt={item.name}/> : <CML_logo className="action-bar-entry-logo" />) },
                             tooltip : getTooltipOnSearchResult,
                             code : item.type === 'artist' ? playlistAddType.ARTIST :
                                    item.type === 'album' ? playlistAddType.ALBUM :
                                    item.type === 'genre' ? playlistAddType.GENRE :
                                    item.type === "playlist" ? playlistAddType.PLAYLIST :
                                    playlistAddType.TRACK,
                             fileName : fileName,
                             ...itemSorted}});
            console.log(remappedTrack);
            setProposedEntryToAdd(remappedTrack);
        })
        
    }
    const onClickArroundSearch = (e) => {
        if(searchbarFocused){return}
        setTimeout(() => {
            requestAnimationFrame(() => {
              searchInputRef.current?.focus();
            });
          }, 0);
    }
    const handleActionBarEntryClick = (entry) => {
        const data = new FormData();
        data.append("addRequest", JSON.stringify({playlistId : albumId, endpoint : entry.code, entryId : entry.id, addAllToFavorite : isFavPlaylist || false}));
        fetch(`${apiBase}/read-write/addToPlaylist`, {
            method : "POST",
            credentials : "include",
            body : data
        })
        .then(res => res.json())
        .then(data => {refetchAlbum(); closeSearchBar(); addNotification("Added to playlist", notifTypes.INFO)})
    };

    useEffect(() => {
        const handleClickedOutside = (e) =>{            
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                closeSearchBar();
            }}

        document.addEventListener("mousedown", handleClickedOutside);
        document.addEventListener("touchstart", handleClickedOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickedOutside);
            document.removeEventListener("touchstart", handleClickedOutside);
        }
    },[]);


    const closeSearchBar = () => {
        setSearchbarFocused(false);
        searchInputRef.current.value = ""
        setProposedEntryToAdd([]);
    }

    const trackCliced = (id) => {
        getNextSongsFromAlbum(id, showOnlyFavs);
    }
    return (
        <div className="album-view">
            <button className="roundButton" onClick={() => window.history.back()}>
                <IconArrowBackUp />
            </button>
            {(album?.cover) && <img src={`${apiBase}/covers/${album.cover}`} className="background-image" alt="background" />}
            {(album && tracks) ? (
                <div className="album-details">
                    <h1>{album.title}</h1>
                    { <div className="album-artists">
                        {(artists) ? artists.map((artist)=>{
                            return (
                                <span key={artist.id} className="artist-name" onClick={()=>{navigate(`/${isPlaylist? "users" : "artists"}/${artist.id}`)}}>{artist.name}</span>
                            )

                        }) : (<span className="artist-name">Unknown {isPlaylist ? "Members" : "Artist"}</span>)}
                    </div>}
                    
                    <div className="album-content">
                        <div className="album-cover-genres">
                            <div className="album-cover-wrapper">
                            {(album.cover)?
                            <img src={`${apiBase}/covers/${album.cover}`} alt={`${album.title} cover`} className="cover-image" />
                            : <CML_logo className="cover-image" />}
                            <div className="genres-album-div">
                                {genres.map((genre, index) => (
                                    <span key={index} className="genre-album" onClick={() => {navigate(`/genres/${genre.genreId}`)}}>{genre.genreName}</span>
                                ))}
                            </div>
                            { (album.description) && <p>{album.description}</p>}
                            </div>
                        </div>
                        <div className="track-list">
                            <div className="track-list-header">
                                <ButtonWithCallback text={'Add to queue'} icon={<IconCodePlus/>} onClick={handleAddToQueue}/>
                                <ButtonWithCallback text={'Random'} icon={<IconArrowsShuffle />} onClick={handleShuffle}/>
                                {(!isFavPlaylist) &&
                                    <button className="button-with-callback" onClick={openEdit}>
                                        <IconEdit/>
                                    </button>
                                }
                                 {(!isFavPlaylist) && favFilterAvaliable &&
                                    <button className="button-with-callback" data-is-active={showOnlyFavs} onClick={() => {setShowOnlyFavs(!showOnlyFavs)}}>
                                        <IconFilterStar/>
                                    </button>
                                }
                                {album.lossless === 1 && <div className="lossless"><span>Lossless</span> <IconChartScatter3d/></div>}
                            </div>
                            {(isPlaylist) &&         
                                <div className="action-bar" is-playlist-add={"true"} ref={wrapperRef}>
                                    <div className="action-bar-research" id="playlist-researchbar" 
                                        onClick={onClickArroundSearch} >
                                        <div className="action-bar-logo-container"><IconSearch className="action-bar-current-logo" /> </div>
                                        <input
                                            className="searchbar"
                                            type="text"
                                            id="playlist-searchbar"
                                            onChange={fetchSearchResults}
                                            placeholder="Search for tracks, artists, genres, playlists to add."
                                            ref={searchInputRef}
                                            onFocus={() => { setSearchbarFocused(true); }}/>

                                    <div className="action-bar-results" style={{display : `${(searchbarFocused) ?  "block": "none"}`}} >
                                    <List
                                        height={300}
                                        itemCount={proposedEntryToAdd.length}
                                        itemSize={50}
                                        width={'calc(100% - 0px)'}
                                        
                                        style={{overflowY: "auto", marginBottom: "20px"}}
                                    >
                                        {({ index, style }) => 
                                            <ActionBarEntry key={index} entry={proposedEntryToAdd[index]} 
                                                style={{...style, width:" calc(100% - 20px)", marginTop: "10px"}} 
                                                onClick={handleActionBarEntryClick}/>
                                        }

                                    </List>
                                    </div>
                                    </div>
                                    
                                </div>}

                            {tracks.map((track, index) => (
                                <TrackView key={track.id} index={index} track={track} onClick={trackCliced} playIconId={currentPlayIcon} showCover={isPlaylist}/>))}
                        </div>
                    </div>
                </div>
            ): (<Loading text={"Loading album"}/>)}
            
        </div>
    )
}

export default AlbumView;