import { use, useEffect, useState } from 'react';
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
        this.coverURL = URL.createObjectURL(new Blob([cover.data], { type: cover.format }))
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
    //this avoids fetching the metadate when we remove the songs from the list
    let deleting = false;

    // const handleSetActiveIndex = (index) => {
    //     setActiveIndex(index);
    // }
    const handleTracksSelected = async (tracks) => {
        if (tracks.length === 0) return;
        setTotalMeta(tracks.length);
        setToAddTracks((prev) => [...prev, ...tracks]); // Add the new metadatas to the list of tracks
        const localMetadatas = await fetchMetadata(tracks);
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
                    metadata.common.artist,
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

    const fetchMetadata = async (tracks) => {
        setActiveIndex(1);
        let localMetadatas = [];
        //fetch the filenames from the files and parse them
        await Promise.all(
            Array.from(tracks).map(async (track) => {
            let meta = await parseBlob(track);
            if(meta.common.title == undefined){
                meta.common.title = track.name;
            }
            if(meta.common.album == undefined){
                meta.common.album = meta.common.title;
            }
            localMetadatas.push(meta);
            setFinishedMeta(localMetadatas.length);
        }));       
        return localMetadatas;
    }

    const deleteAlbum = (uuid) => {
        console.log("Deleting album: " + uuid);
        deleting = true;
        const tracksToDelete = albums.find(album => album.uuid === uuid).tracks;
        const tracksCopy = [...toAddTracks];
        const filteredTracks = tracksCopy.filter(track => tracksToDelete.includes(track));
        setToAddTracks(filteredTracks);
       

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
        bodyAlbumFormData.append("albums", JSON.stringify(albums));
        let totalBytes = toAddTracks.reduce((acc, track) => acc + track.size, 0); 
        setTotalMbUpload((totalBytes/1024/1024).toFixed(1));
        await fetch("http://localhost:4590/read-write/upload", {
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
        bodyAlbumFormData = null; //clear the form data to free memory

        for (let i = 0; i < toAddTracks.length; i++) {
            const track = toAddTracks[i];
            const bodyFormData = new FormData();
            bodyFormData.append("tracksMeta", JSON.stringify(metadatas[i]));
            bodyFormData.append("music", track); // Append each file individually
            console.log("Adding file to form data: ", track);
            setSendingFile(track.name);
            await axios({
                method: "POST",
                data: bodyFormData,
                withCredentials: true, // include credentials
                url: "/upload", // route name
                baseURL: "http://localhost:4590/read-write", //local url
                onUploadProgress: progress => {
                    const { total, loaded } = progress;
                    const totalSizeInMB = total / 1000000;
                    const loadedSizeInMB = loaded / 1000000;
                    const uploadPercentage = (loadedSizeInMB / totalSizeInMB) * 100;
                   
                    setPercentageUpload(uploadPercentage.toFixed(2));
                    console.log("total size in MB ==> ", totalSizeInMB, " upload percentage ==> ", uploadPercentage);
                },
              });
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
