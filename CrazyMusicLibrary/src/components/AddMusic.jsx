import { use, useEffect, useRef, useState } from 'react';
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




class Album{


    constructor(name, artist, year, tracks, cover, uuid){
        this.name = name;
        this.artist = artist;
        this.year = year;
        this.tracks = tracks;
        this.coverURL = this.setCover(cover);
        this.uuid = uuid;
    }
    setCover(cover) {
        //escape if already a cover or no cover given
        if(!cover || this.coverURL) return;
        this.coverData = cover.data;         // binary data (Uint8Array or Buffer)
        this.coverMime = cover.format;
        this.coverURL = URL.createObjectURL(new Blob([this.coverData], { type: this.coverMime}))
        this.ext = this.coverMime.split('/')[1]; // get the extension from the mime type
    }
    setCoverFromFile(file) {
        this.coverURL = URL.createObjectURL(file);
        this.coverMime = file.type;
        this.ext = file.name.split('.').pop();
        // Read file as ArrayBuffer for binary data
        const reader = new FileReader();
        reader.onload = () => {
            this.coverData = new Uint8Array(reader.result); // Binary data
        };
        reader.readAsArrayBuffer(file);

        return this.coverURL;
    }
}

const AddMusic = ({closeOverlay}) => {
    const [fromFile, setFromFile] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [toAddTracks, setToAddTracks] = useState([]);
    const [finishedMeta, setFinishedMeta] = useState(0);
    const [totalMeta, setTotalMeta] = useState(0);
    const [metadatas, setMetadatas] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [editingAlbum, setEditingAlbum] = useState("xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx");
    const [totalMbUpload, setTotalMbUpload] = useState(0);
    const [percentageUpload, setPercentageUpload] = useState(0);
    const [sendingFile, setSendingFile] = useState('');
    const [trackMetaOverwrite, setTrackMetaOverwrite] = useState([]); //contains all the metadatas that the user changed
    //this avoids fetching the metadate when we remove the songs from the list
    let deleting = false;
    // const handleSetActiveIndex = (index) => {
    //     setActiveIndex(index);
    // }
    let awaitForTrackOverwite = useRef(false); //used to avoid setting the state when the user deletes the album
    let pendingTracksForMetaFetch = useRef(null);
    const handleTracksSelected = async (tracks) => {
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
    useEffect(() => { 
        setFinishedMeta(0); 
        setActiveIndex(2);
        console.log("Reconstructing albums... " + albums[0]);
    }, [albums]);

    const reconstructAlbums = (tempMetadatas) => {
        function findAlbumId(name, albums) {
            return albums.findIndex((album) => album.name === name);
        }
    
        let localAlbums = [];
    
        for (let i = 0; i < tempMetadatas.length; i++) {
            let metadata = tempMetadatas[i];
            metadata.trackUploadId = i;
            const albumId = findAlbumId(metadata.common.album, localAlbums);
            if (albumId === -1) {
                const newUuid = uuidv4();
                localAlbums.push(new Album(
                    metadata.common.album,
                    (metadata.common.artist) ? metadata.common.artist : 'Unknown artist',
                    metadata.common.year,
                    [metadata.uuid],
                    metadata.common.picture?.[0],
                    newUuid
                ));
                metadata.albumUuid = newUuid;
            } else {
                localAlbums[albumId].tracks.push(metadata.uuid);
                localAlbums[albumId].setCover(metadata.common.picture?.[0]);
                metadata.albumUuid = localAlbums[albumId].uuid;
            }
        }
        setMetadatas((prev) => ([...prev, ...tempMetadatas]));
        return localAlbums;
    };
    
    const handleReconstruct = (tempMetas) => {
        const newAlbums = reconstructAlbums(tempMetas);
        // Delay to wait for metadatas state to update
        setTimeout(() => {
            setAlbums((prev) => [...prev, ...newAlbums]);
        }, 400);
    };

    const fetchMetadata = async () => {
        console.log("enter")
        const tracks = pendingTracksForMetaFetch.current;
        setActiveIndex(1);
        let localMetadatas = [];
        let modifiedMetas = trackMetaOverwrite;
        //fetch the filenames from the files and parse them
        await Promise.all(
            Array.from(tracks).map(async (track, index) => {
            let meta = await parseBlob(track);
            let modifiedMeta = modifiedMetas[index];
            if(!meta.common.title){
                meta.common.title = track.name;
                modifiedMeta.title = track.name;
            }
            if(!meta.common.album){
                meta.common.album = meta.common.title;
                modifiedMeta.album = meta.common.title;
            }

            localMetadatas.push(meta);
            setFinishedMeta(localMetadatas.length);
        }));       
        setTrackMetaOverwrite(modifiedMetas); //add the modified metadata to the list
        return localMetadatas;
    }



    const deleteAlbum = (uuid) => {
        console.log("Deleting album: " + uuid);
        deleting = true;
        let modifiedMetaLocal = [...trackMetaOverwrite];
        const tracksToDelete = albums.find(album => album.uuid === uuid).tracks;
        const tracksCopy = [...toAddTracks];
        const filteredTracks = tracksCopy.filter((track, index) => {
            if(tracksToDelete.includes(track)){
                console.log("Deleting track: " + track.name);
                modifiedMetaLocal.splice(index, 1)

                return false; // Filter out the track
            }
        });
        setToAddTracks(filteredTracks);
        setTrackMetaOverwrite(modifiedMetaLocal);

        const newAlbums = albums.filter(album => album.uuid !== uuid);
        setAlbums(newAlbums);
    }
    const editAlbum = (uuid) => {
        console.log("Editing album: " + uuid);
        setEditingAlbum(uuid);
    }

    useEffect(() => {
        if(editingAlbum === null || albums.length === 0) {setActiveIndex(2); return;};
        setActiveIndex(3);
    }, [editingAlbum]);

    const publish = async () => {
        if (toAddTracks.length === 0) return;
        setActiveIndex(4);
        let bodyAlbumFormData = new FormData();
        bodyAlbumFormData.append("albums", JSON.stringify(albums.map((album) => {
            //remove the coverURL from the album object
            const { coverURL,  ...albumWithoutCover} = album;
            return {...albumWithoutCover}
        })));
        const covers =  albums.map((album) => {
            if(!album.coverData) return null; //skip if no cover data
            const uint8Array = new Uint8Array(album.coverData); // ensure proper binary format
            const blob = new Blob([uint8Array], { type: album.coverMime });

            // Optional: if you want to give it a name
            const coverImage = new File([blob], `${album.uuid}.${album.coverMime.split('/').pop()}`, { type: album.coverMime});
            return coverImage;
        }); 
        
        //send the covers as well
        for(const cover of covers){if(!cover){continue;} bodyAlbumFormData.append("cover", cover);}

        await fetch(`${apiBase}/read-write/upload`, {
            method: "POST",
            body: bodyAlbumFormData,
            credentials: "include",
        })
        .then((response) => {
            if (!response.ok) {
                console.error("Error uploading albums:", response.statusText);
                throw new Error("Error uploading albums");
            }
            return response.json();
        })
        .then((data) => {console.log( data);});

        //album upload finished, we can revoke the covers etc:
        albums.forEach(album => {
            if (album.coverURL) {
                URL.revokeObjectURL(album.coverURL);
                album.coverURL = null; //revoke blob reference to destroy it
            }
        });
        bodyAlbumFormData = null; //clear the form data to free memory
        let totalBytes = toAddTracks.reduce((acc, track) => acc + track.size, 0); 
        setTotalMbUpload((totalBytes/1024/1024).toFixed(1));

        for (let i = 0; i < toAddTracks.length; i++) {
            const track = toAddTracks[i];
            let bodyFormData = new FormData();
            bodyFormData.append("albumId", JSON.stringify(metadatas[i].albumUuid));
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
                    const uploadPercentage = (loadedSizeInMB / totalSizeInMB) * 100;
                   
                    setPercentageUpload(uploadPercentage.toFixed(2));
                    console.log("total size in MB ==> ", totalSizeInMB, " upload percentage ==> ", uploadPercentage);
                },
              }).catch((error) => {
                console.error("Error uploading track:", error);});
            bodyFormData = null; //clear the form data to free memory
        }
        console.log("Upload finished");
        setTimeout(() => {
            setToAddTracks([]);
            setMetadatas([]);
            setFinishedMeta(0);
            setAlbums([]);
            setActiveIndex(0);
            setEditingAlbum("xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx");
            setPercentageUpload(0);
            console.log("Closing overlay");
            closeOverlay();
        }, 750);

    }
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
                return <Loading text={`Publishing ${sendingFile} ${totalMbUpload}Mb..`} 
                        progressBar={{useProgressBar: true, showPercent: true, isMarquee: true, 
                            percent: percentageUpload, fillColor: 'var(--cool-green)'}} />;
            default:
                return <div className="addMusicSource"><p>Not implemented yet</p></div>;
        }   
    }
    return(
        <div className="addMusicContainer">
            <IconX className="buttonRound closeOverlay" onClick={closeOverlay}/>
            <h2>Add Music</h2>
            <ActiveIndex context={{name: "AddMusic", length: 5}} active={activeIndex} setActive={null}/>
            < MusicWindowState />
        </div>
    )

}

export default AddMusic
