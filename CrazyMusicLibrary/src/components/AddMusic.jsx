import { createContext, use, useContext, useEffect, useRef, useState } from 'react';
import './AddMusic.css' 
import {IconX} from '@tabler/icons-react';
import ActiveIndex from './ActiveIndex';
import MusicSource from './AddMusic/MusicSource';
import Loading from './Loading';
import {parseBlob} from 'music-metadata';
import AlbumsOverview from './AddMusic/AlbumsOverview';
import { v4 as uuidv4 } from 'uuid';
import AlbumWrapping from './AddMusic/AlbumWrapping';
import axios from 'axios';
import apiBase from '../../APIbase';
import { useNotifications } from '../GlobalNotificationsProvider';




class Album{
    constructor(name, artist, year, tracks, cover, uuid ){
        this.name = name;
        this.artist = artist;
        this.year = year;
        this.tracks = tracks;
        this.setCover(cover);
        this.uuid = uuid;
    }
    setCover(cover) {
        //escape if already a cover or no cover given
        if(!cover || this.coverURL) {     
            return;
        };
        this.coverData = cover.data;         // binary data (Uint8Array or Buffer)
        this.coverMime = cover.format;
        this.coverURL = URL.createObjectURL(new Blob([this.coverData], { type: this.coverMime}))
        this.ext = this.coverMime.split('/')[1]; // get the extension from the mime type
        this.sourceIsBinary = true; // set the source to binary
    }
    setCoverFromFile(file) {
        this.coverURL = URL.createObjectURL(file);
        this.coverFile = file;
        console.log("Setting cover from file: " , file);
        this.ext = file.type.split('/')[1]; // get the extension from the mime type
        return this.coverURL;
    }
}

const AddMusicContext = createContext();

const AddMusic = ({closeOverlay, uploadPercent, uploadProgress, uploadFinished, isMinimize, setMinimized}) => { 
    //todo a bit dirty, maybe move all in a provider. A lot is implemented so it might cost time to do..
    //-> So we can access the upload percentage everywhere from.
    const [fromFile, setFromFile] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [toAddTracks, setToAddTracks] = useState([]);
    const [finishedMeta, setFinishedMeta] = useState(0);
    const [totalMeta, setTotalMeta] = useState(0);
    const [metadatas, setMetadatas] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [avoidChangeWindowAlbum, setAvoidChangeWindowAlbum] = useState(false); //used to avoid changing the window when the user is editing an album
    const [editingAlbum, setEditingAlbum] = useState("xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx");
    const [totalMbUpload, setTotalMbUpload] = useState(0);
    const [percentageUpload, setPercentageUpload] = useState(0);
    const [sendingFile, setSendingFile] = useState('');
    const {addNotification, notifTypes } = useNotifications();
     //contains all the metadatas that the user changed, used to avoid sending all the metas with the song with fetch
    const [trackMetaOverwrite, setTrackMetaOverwrite] = useState([]);
    
    //this avoids fetching the metadate when we remove the songs from the list
    let deleting = false;



    let awaitForTrackOverwite = useRef(false); //used to avoid setting the state when the user deletes the album
    let pendingTracksForMetaFetch = useRef(null);

    const handleTracksSelected = async (tracks) => {
        console.log("Tracks selected: ", tracks);
        if (tracks.length === 0) return;

        setTotalMeta(tracks.length);
        setToAddTracks((prev) => [...prev, ...tracks]); // Add the new metadatas to the list of tracks
        pendingTracksForMetaFetch.current = tracks;
        let idMapping = [];
        for (let i = 0; i < tracks.length; i++) {
            idMapping.push({id: uuidv4()});
        }
        awaitForTrackOverwite.current = true; //set the flag to true to avoid setting to trigger fetch metas
        setTrackMetaOverwrite((prev) => [...prev, ...idMapping]); //add the modified metadata to the list
        
    }
    useEffect(() => {
        console.log("Track meta overwrite changed: ", trackMetaOverwrite);
        if(awaitForTrackOverwite.current){
            awaitForTrackOverwite.current = false;
            beginFetchMeta();
        }
    },[trackMetaOverwrite]);

    const beginFetchMeta = async () => {
        const localMetadatas = await fetchMetadata();
        handleReconstruct(localMetadatas);
    }

    const updateAlbums = (newAlbum) => {
        const filteredAlbums = newAlbum.filter(({tracks}) => tracks.length > 0); //remove empty albums
        setAvoidChangeWindowAlbum(true);
        setAlbums(filteredAlbums);
    }
    useEffect(() => { 
        console.log("Reconstructing albums... " , albums);
        if(avoidChangeWindowAlbum){return;}; //if we are editing an album, do not change the window
        setFinishedMeta(0); 
        setActiveIndex(2);
    }, [albums]);

    const reconstructAlbums = (tempMetadatas ) => {
        function findAlbumId(name, albums) {
            return albums.findIndex((album) => album.name === name);
        }
        let localAlbums = [];
        let metaOverwriteTemp = trackMetaOverwrite;
        for (let i = 0; i < tempMetadatas.length; i++) {
            let metadata = tempMetadatas[i];
            const remapedIdInUUIDS = trackMetaOverwrite.length - tempMetadatas.length + i;
            const albumId = findAlbumId(metadata.common.album, localAlbums);
            const trackInfo = 
                {id : trackMetaOverwrite[remapedIdInUUIDS].id,
                name: metadata.common.title || trackMetaOverwrite[remapedIdInUUIDS].title};
            if (albumId === -1) {
                const newUuid = uuidv4();
                localAlbums.push(new Album(
                    metadata.common.album,
                    (metadata.common.artist) ? metadata.common.artist.split(",").map((g) => g.trim()) : ['Unknown artist'],
                    metadata.common.year,
                    [trackInfo],
                    metadata.common.picture?.[0],
                    newUuid
                ));
                metaOverwriteTemp[remapedIdInUUIDS].albumUuid = newUuid;
            } else {
                localAlbums[albumId].tracks.push(trackInfo);
                metaOverwriteTemp[remapedIdInUUIDS].albumUuid = localAlbums[albumId].uuid;
            }
        }
        setMetadatas((prev) => ([...prev, ...tempMetadatas]));
        setTrackMetaOverwrite(metaOverwriteTemp); //update the trackMetaOverwrite with the new album UUIDs

        return localAlbums;
    };
    
    const handleReconstruct = (tempMetas) => {
        const newAlbums = reconstructAlbums(tempMetas);
        // Delay to wait for metadatas state to update
        setTimeout(() => {
            setAvoidChangeWindowAlbum(false);
            setAlbums((prev) => [...prev, ...newAlbums]);
        }, 400);
    };

    const fetchMetadata = async () => {
        const rawTracks = pendingTracksForMetaFetch.current;
        const tracks = Array.from(rawTracks)
        setActiveIndex(1);
        let localMetadatas = [];
        let modifiedMetas = trackMetaOverwrite;
        const relativeShift =  trackMetaOverwrite.length - tracks.length; //get the index just before the new tracks
        //fetch the filenames from the files and parse them
        await Promise.all(
            tracks.map(async (track, index) => {
            let meta = await parseBlob(track);
            let modifiedMeta = modifiedMetas[index + relativeShift]; //get the modified metadata from the list
            if(!meta.common.title){
                meta.common.title = track.name;
                console.log("No title found, using filename: " + track.name);
                modifiedMeta.title = track.name;
            }
            if(!meta.common.album){
                meta.common.album = meta.common.title;
                modifiedMeta.album = meta.common.title;
            }
            modifiedMeta.duration = meta.format.duration;
            modifiedMeta.year = meta.common.year;
            modifiedMeta.no = meta.common.track?.no || 0;
            modifiedMeta.title = meta.common.title;

            localMetadatas.splice(index, 0, meta); //insert the metadata at the index of the track
            setFinishedMeta(localMetadatas.length);
        }));       
        setTrackMetaOverwrite(modifiedMetas); //add the modified metadata to the list
        return localMetadatas; //this is to rebuild the albums
    }



    const deleteAlbum = (uuid) => {
        deleting = true;
        let metaLocal = trackMetaOverwrite;
        const tracksToDelete = albums.find(album => album.uuid === uuid).tracks
            .map(track => track.id); //get the tracks to delete from the album
        let tracksCopy = toAddTracks;

        const filteredTracksMeta = metaLocal.filter((track) =>  !tracksToDelete.includes(track.id));
        const survivingIndicies = metaLocal.map((track, index) => tracksToDelete.includes(track.id) ? null :  index)
            .filter((index) => index !== null); //map only the remainin indecies and filter the others out
        const filteredTracks = survivingIndicies.map((index) => tracksCopy[index]); //get the remaining tracks

        setToAddTracks(filteredTracks);
        setTrackMetaOverwrite(filteredTracksMeta);

        const newAlbums = albums.filter(album => album.uuid !== uuid);
        setAvoidChangeWindowAlbum(false);
        setAlbums(newAlbums);
    }
    const editAlbum = (uuid) => {
        setEditingAlbum(uuid);
    }

    useEffect(() => {
        if(editingAlbum === null || albums.length === 0) {setActiveIndex(2); return;};
        setActiveIndex(3);
    }, [editingAlbum]);

    
    const moveTrackToNewAlbum = (track, newAlbumName) => {
        let metaLocal = trackMetaOverwrite;
        const { id: trackId, name: trackName } = track;
        const newUuid = uuidv4();
        console.log("Moving track: " + trackId + +" from " + editingAlbum +" to album: " + newUuid);
       
        metaLocal = metaLocal.map((track) => {
            if (track.id === trackId) track.albumUuid = newUuid;
            return track;}); //update the albumId of the track

        let albumLocal = albums.map(album => {
            if (album.uuid === editingAlbum){
                album.tracks = album.tracks.filter(track => track.id !== trackId); //remove the track from the old album
            }
            return album;});
        const newAlbum = new Album(newAlbumName, ['Unknown artist'], '', [{id: trackId, name: trackName}], null, newUuid);
        albumLocal.push(newAlbum); //add the new album to the list
        setTrackMetaOverwrite(metaLocal);
        updateAlbums(albumLocal);
        addNotification(`Track ${trackName.substring(0,60)} got moved to album ${newAlbumName}.`, notifTypes.INFO);
    }

    const moveTrackToAlbum = (track, newAlbumId) => {
        let metaLocal = trackMetaOverwrite;
        const { id: trackId, name: trackName } = track;

        console.log("Moving track: " + trackId + +" from " + editingAlbum +" to album: " + newAlbumId);
        const albumName = albums.find(album => album.uuid === newAlbumId).name;
        metaLocal = metaLocal.map((track) => {
            if (track.id === trackId) track.albumUuid = newAlbumId;
            return track;}); //update the albumId of the track

        let albumLocal = albums.map(album => {
            if(album.uuid === newAlbumId){
                album.tracks.push({id: trackId, name: trackName}); //add the track to the new album
            } else if (album.uuid === editingAlbum){
                album.tracks = album.tracks.filter(track => track.id !== trackId); //remove the track from the old album
            }
            return album;});
        setTrackMetaOverwrite(metaLocal);
        updateAlbums(albumLocal);
        addNotification(`Track ${trackName.substring(0,60)} got moved to album ${albumName}.`, notifTypes.INFO);
    }

    const publish = async () => {
        if(deleting) {console.log("Deleting, aborting publish"); return;}; //if deleting, abort the publish
        console.log("Publishing tracks: ", toAddTracks);
        if (toAddTracks.length === 0) {console.log("No track to publish, abort."); return};
        setActiveIndex(4);

        const covers =  albums.map((album) => {
            console.log("Album: " , album);
            if(!album.sourceIsBinary){
                if(!album.coverFile){return null;} //skip if no cover file
                console.log("Using file reference for cover: " + album.coverFile);
                return album.coverFile; //return the file reference
            }
            console.log("Using binary reference for cover: " , album.uuid);
            if(!album.coverData || album.coverData.length === 0) {console.log('returned no cover at', album.uuid); return null;} //skip if no cover data
            const uint8Array = new Uint8Array(album.coverData); // ensure proper binary format
            const blob = new Blob([uint8Array], { type: album.coverMime });

            // Optional: if you want to give it a name
            const coverImage = new File([blob], `${album.uuid}.${album.coverMime.split('/').pop()}`, { type: album.coverMime});
            return coverImage;
        }); 
        
        //send the covers as well
        for (let i = 0; i < albums.length; i++) {
            let bodyAlbumFormData = new FormData();
            const { coverURL, sourceIsBinary, tracks, coverFile, coverData, ...albumWithoutCover} = albums[i]; //remove the coverURL from the album object
            bodyAlbumFormData.append("album", JSON.stringify({...albumWithoutCover})); //todo need some cleanup if album uploaded one after another, no array

            if(covers[i]){bodyAlbumFormData.append("cover", covers[i]);}

            const res = await fetch(`${apiBase}/read-write/upload`, {
                method: "POST",
                body: bodyAlbumFormData,
                credentials: "include",
            })
            if (!res.ok) {
                console.error("Error uploading albums:", res.statusText);
                throw new Error("Error uploading albums");
            }
            bodyAlbumFormData = null; //clear the form data to free memory
            console.log("Album uploaded: " + albums[i].name);

        }
        //album upload finished, we can revoke the covers etc:
        albums.forEach(album => {
            if (album.coverURL) {
                URL.revokeObjectURL(album.coverURL);
                album.coverURL = null; //revoke blob reference to destroy it
            }
        });

        let totalBytes = toAddTracks.reduce((acc, track) => acc + track.size, 0); 
        setTotalMbUpload((totalBytes/1024/1024).toFixed(1));

        for (let i = 0; i < toAddTracks.length; i++) {
            const track = toAddTracks[i];
            let bodyFormData = new FormData();
            bodyFormData.append("trackMeta", JSON.stringify(trackMetaOverwrite[i])); // Append the metadata, BEFORE the track, otherwise might not be populated yet
            bodyFormData.append("music", track); // Append each file individually
            setSendingFile(track.name);
            
            await axios({
                method: "POST",
                data: bodyFormData,
                withCredentials: true, // include credentials
                url: "/upload", // route name
                baseURL: `${apiBase}/read-write`, //local url
                onUploadProgress: progress => {
                    const { total, loaded } = progress;
                    const totalSizeInMB = total / 1000000;
                    const loadedSizeInMB = loaded / 1000000;
                    uploadPercent(loadedSizeInMB / totalSizeInMB);
                    const uploadPercentage = (loadedSizeInMB / totalSizeInMB) * 100;
                   
                    setPercentageUpload(uploadPercentage.toFixed(2));
                    // console.log("total size in MB ==> ", totalSizeInMB, " upload percentage ==> ", uploadPercentage);
                },
              })
              .then(() => {
                    uploadProgress({done : i, total: toAddTracks.length });
                })
              .catch((error) => {
                console.error("Error uploading track:", error);});
            bodyFormData = null; //clear the form data to free memory
        }
        console.log("Upload finished");
        uploadFinished();
        setTimeout(() => {
            setToAddTracks([]);
            setMetadatas([]);
            setFinishedMeta(0);
            setAlbums([]);
            setActiveIndex(0);
            setEditingAlbum("xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx");
            setPercentageUpload(0);
            console.log("Closing overlay");
            const event = new CustomEvent("musicUploaded",{});
            window.dispatchEvent(event)
            closeOverlay();
        }, 750);

    }
    const handleClose = () => {
        if(activeIndex !== 4){
            closeOverlay();
            return
        }
        setMinimized(true);
    }
    useEffect(() => { if(deleting){deleting = false;}}, [toAddTracks]);
    const MusicWindowState = () => {
        switch(activeIndex){
            case 0:
                return <MusicSource fromFile={fromFile} setFromFile={setFromFile} tracksSelected={handleTracksSelected}
                    initMetadataFetching={fetchMetadata} />;
            case 1:
                return <Loading text={`Fetching metadata... ${(totalMeta) ? finishedMeta+'/'+totalMeta : "-/-"}`} />;
            case 2:
                return <AlbumsOverview albums={albums} addNewMusic={() => setActiveIndex(0)} deleteAlbum={deleteAlbum} editAlbum={editAlbum} publish={publish}/>;
            case 3:
                return <AlbumWrapping setEditUid={setEditingAlbum} albumClass={albums.find(album => album.uuid === editingAlbum)}/>;
            case 4:
                return (<div style={{padding: "20px"}}>
                <Loading text={`Publishing ${sendingFile} ${totalMbUpload}Mb..`} 
                        progressBar={{useProgressBar: true, showPercent: true, isMarquee: false, 
                            percent: Number(percentageUpload), fillColor: 'var(--cool-green)'}} />
                            <p>You can close this overlay, the upload will continue. :)</p>
                        </div>);
            default:
                return <div className="addMusicSource"><p>Not implemented yet</p></div>;
        }   
    }
    return(
        <div className="addMusicContainer" style={(isMinimize) ? {display : "none"} : {}}>
            <AddMusicContext.Provider value={{albums, moveTrackToNewAlbum, editingAlbum, moveTrackToAlbum, setEditingAlbum}}>
                <IconX className="buttonRound closeOverlay" onClick={handleClose}/>
                <h2>Add Music</h2>
                <ActiveIndex context={{name: "AddMusic", length: 5}} active={activeIndex} setActive={null}/>
                < MusicWindowState />
            </AddMusicContext.Provider>
        </div>
    )

}

export default AddMusic
export const useAddMusicContext = () => useContext(AddMusicContext);