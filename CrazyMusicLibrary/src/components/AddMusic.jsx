import { createContext, useContext, useEffect, useRef, useState } from 'react';
import './AddMusic.css'
import { IconX } from '@tabler/icons-react';
import ActiveIndex from './ActiveIndex.jsx';
import MusicSource from './AddMusic/MusicSource.jsx';
import Loading from './Loading.jsx';
import { parseBlob } from 'music-metadata';
import AlbumsOverview from './AddMusic/AlbumsOverview.jsx';
import { v4 as uuidv4 } from 'uuid';
import AlbumWrapping from './AddMusic/AlbumWrapping.jsx';
import axios from 'axios';
import apiBase from '../../APIbase.js';
import { useNotifications } from '../GlobalNotificationsProvider.jsx';
import { useEventContext } from '../GlobalEventProvider.jsx';



class Album {
    /**
     * 
     * @param {string} name 
     * @param {string[]} artist 
     * @param {Number} year 
     * @param {Track[]} tracks 
     * @param {File} cover 
     * @param {String} uuid 
     */
    constructor(name, artist, year, cover, uuid) {
        this.name = name;
        this.artist = artist;
        this.year = year;
        this.tracks = [];
        this.setCover(cover);
        this.uuid = uuid;
    }
    setCover(cover) {
        //escape if already a cover or no cover given
        if (!cover || this.coverURL) {
            return;
        };
        this.coverData = cover.data;         // binary data (Uint8Array or Buffer)
        this.coverMime = cover.format;
        this.coverURL = URL.createObjectURL(new Blob([this.coverData], { type: this.coverMime }))
        this.ext = this.coverMime.split('/')[1]; // get the extension from the mime type
        this.sourceIsBinary = true; // set the source to binary
    }
    setCoverFromFile(file) {
        this.coverURL = URL.createObjectURL(file);
        this.coverFile = file;
        console.log("Setting cover from file: ", file);
        this.ext = file.type.split('/')[1]; // get the extension from the mime type
        return this.coverURL;
    }
    /**
     * 
     * @param {Track} track 
     */
    addTrack(track){
        if(!track) return;
        this.tracks.push(track);
        track.album = this;
    }
    removeTrack(track){
        if(!track) return;
        this.tracks = this.tracks.filter(albTrack => albTrack.id !== track.id);
        track.album = null;
    }
    /**
     * 
     * @returns Only the data needed for the album upload
     */
    getPuredData(){
        return {name : this.name, artists : this.artist, year : this.year, uuid : this.uuid, ext: this.ext }
    }

    /**
     * 
     * @returns {File}A pured File cover
     */
    getPuredCover(){
        if (!this.sourceIsBinary) {
            if (!this.coverFile) { return null; } //skip if no cover file
            console.log("Using file reference for cover: " + album.coverFile);
            return this.coverFile; //return the file reference
        }
        console.log("Using binary reference for cover: ", this.uuid);
        if (!this.coverData || this.coverData.length === 0) 
        { console.log('returned no cover at', this.uuid);
         return null; } //skip if no cover data
        const uint8Array = new Uint8Array(this.coverData); // ensure proper binary format
        const blob = new Blob([uint8Array], { type: this.coverMime });

        // Optional: if you want to give it a name
        const coverImage = new File([blob], `${this.uuid}.${this.coverMime.split('/').pop()}`, { type: this.coverMime });
        return coverImage;
    }
}

class Track {
    constructor(file) {
        this.id = uuidv4();
        this.file = file;
        /**@type {Album} */
        this.album = null;
        /**@type {String} */
        this.albumName = "";
        /**@type {String[]} The artists of the song */
        this.artists = [];
        //Fallback if no trackname found
        this.title = file.name;
        this.no = 1;
        this.duration = 0;
        this.year = 2003;
        /** @type {File} */
        this.picture = null; 
    }
    setPicture(picture){
        this.picture = picture
    }
    setAdditionalData(albumName ="", title = "", no = 1, duration = 0, year = 2000, artists = []) {
        this.title = title;
        this.no = no;
        this.duration = duration;
        this.year = year;
        this.artists = artists;
        this.albumName = albumName;
    }
    /** @param {Album} album */
    setAlbum(album) {
        this.album = album;
    }

    // Helper to read the file as a blob URL
    getUrl() {
        return URL.createObjectURL(this.file);
    }

    getArtists(){
        return this.artists ? this.artists.map((g) => g.trim())
        : ['Unknown artist'];
    }

    /**
     * 
     * @returns Database-ready track metadatas
     */
    getPuredTrackMeta(){
        return {albumUuid : this.album.uuid, duration : this.duration, no : this.no,
            year : this.year, title : this.title, id : this.id
         }
        
    }
}

const AddMusicContext = createContext();

const AddMusic = ({ closeOverlay, uploadPercent, uploadProgress, uploadFinished, isMinimize, setMinimized }) => {
    //todo a bit dirty, maybe move all in a provider. A lot is implemented so it might cost time to do..
    //-> So we can access the upload percentage everywhere from.
    const [fromFile, setFromFile] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [finishedMeta, setFinishedMeta] = useState(0);
    const [totalMeta, setTotalMeta] = useState(0);
    const [albums, setAlbums] = useState([]);
    const [avoidChangeWindowAlbum, setAvoidChangeWindowAlbum] = useState(false); //used to avoid changing the window when the user is editing an album
    const [editingAlbum, setEditingAlbum] = useState(null);
    const [totalMbUpload, setTotalMbUpload] = useState(0);
    const [percentageUpload, setPercentageUpload] = useState(0);
    const [sendingFile, setSendingFile] = useState('');
    const { addNotification, notifTypes } = useNotifications();
    const [radios, setRadios] = useState(new Map());
    const allTracksRef = useRef([]);
    const allAlbumsRef = useRef([]);
    //this avoids fetching the metadate when we remove the songs from the list
    const {emit} = useEventContext();

    const pendingTracksForMetaFetch = useRef(null);

    /**
     * Wraps the tracks into a Track class and initiate 
     * metadata fetching.
     * @param {File} tracks 
     * @returns 
     */
    const handleTracksSelected = async (tracks) => {
        if (tracks.length === 0) return;

        // New number of metadaa to fetch. Reset at evey song collection added.
        setTotalMeta(tracks.length);
        const newTracks = tracks.map((file) => new Track(file));
        pendingTracksForMetaFetch.current = newTracks;
        fetchMetaAndMapAlbums();

    }


    const fetchMetaAndMapAlbums = async () => {
        const corruptedIds = await fetchMetadata();

        // Keeps only the non-corrupted songs.
        const vaildNewTracks = corruptedIds.length > 0 ? 
            pendingTracksForMetaFetch.current.filter(track => !corruptedIds.includes(track.id))
            : pendingTracksForMetaFetch.current;  
        console.log("Valid new tracks", vaildNewTracks);
        allTracksRef.current = [...allTracksRef.current, ...vaildNewTracks ];
        pendingTracksForMetaFetch.current = null;
        reconstructAlbums();
    }

    /**
     * Removes albums with empty track number
     */
    const sanitizeAndApplyAlbums = () => {
        allAlbumsRef.current = allAlbumsRef.current.filter(album => album.tracks.length > 0); //remove empty albums
        setAvoidChangeWindowAlbum(true);
        setAlbums(allAlbumsRef.current);
    }
    useEffect(() => {
        console.log("New albums ", albums);
        if (avoidChangeWindowAlbum) { return; }; //if we are editing an album, do not change the window
        setFinishedMeta(0);
        setActiveIndex(2);
    }, [albums]);

    

    /**
     * Creates albums if needed and maps the song the albums. 
     */
    const reconstructAlbums = () => {
        function findAlbumId(name) {
            return allAlbumsRef.current.find((album) => album.name === name);
        }
        for (const track of allTracksRef.current) {
            const linkedAlbum = findAlbumId(track.albumName);
            if (!linkedAlbum) {
                const newUuid = uuidv4();
                const newAlbum = new Album(track.albumName,  
                    track.getArtists(),
                    track.year,
                    track.picture,
                    newUuid
                );
                allAlbumsRef.current.push(newAlbum);
                newAlbum.addTrack(track);
            } else {
                linkedAlbum.addTrack(track); 
            }
        }
        setAlbums(allAlbumsRef.current);
    };

    /**
     * Runs a metadata fetch to get name/ track no, artist etc.
     * 
     * @param {*} URL Possible Radio stream URL
     * @returns {String[] } corruptedIds can be used to filter out
     * tracks.
     */
    const fetchMetadata = async (URL = "") => {
        if (!fromFile) {
            if (!URL) return;
            console.log("Fetching meta at source", URL);

            const radioFetch = await fetch(`${apiBase}/radio/metadata/${encodeURIComponent(URL)}`, { method: "GET" })
                .then(res => res.json());
            if (!radioFetch) {
                addNotification("No radio found..", notifTypes.ERROR);
                return;
            } else {
                addNotification("Radio found! " + radioFetch[0].name, notifTypes.INFO);
            }

            const radio = radioFetch[0];
            console.log(radio);
            const oldRadios = radios;
            // The UUID is from another service, which means it might be already used by a track here.
            // This is not a big deal, because radios and tracks are not intended to be exposed
            // in the same context. Rather, we use the uuid to fetch the radio's meta from the third party.
            oldRadios.set(radio.stationuuid, {
                url: radio.url_resolved,
                favicon: radio.favicon,
                name: radio.name,
            })
            setRadios(oldRadios);
            setActiveIndex(2);
            return;
        }
        // const tracks = rawTracks
        setActiveIndex(1);
        /**
         * A list of track uuid with corrupted metadatas/content
         *  @type {String[]} 
        */
        const errorWithTrack = [];
        //fetch the filenames from the files and parse them
        await Promise.all(
            pendingTracksForMetaFetch.current.map(async (track) => {
                const meta = await parseBlob(track.file).catch((err) => {
                    console.error("error at", file, err);
                    addNotification(`Track ${track.title} seems corrupted, retry without it.`,
                        notifTypes.ERROR)
                });
                // Leave the promise if an error occured.
                if (!meta) { 
                    errorWithTrack.push(track.id);
                    return; 
                }

                track.setAdditionalData(
                    meta.common.album || meta.common.title,
                    meta.common.title || track.file.name,
                    meta.common.track?.no || 0,
                    meta.format.duration || 0,
                    meta.common.year,
                    // Flats all artists combination and trim all ["A1, A2", "A3 "] => ["A1","A2","A3"]
                    meta.common.artists.map(ar=> ar.split(",")).flat(1).map(a=>a.trim())
                );
                track.setPicture(meta.common?.picture?.[0]);
                setFinishedMeta((prev) => prev + 1);
            }));
        return errorWithTrack;
    }

    const deleteRadio = (uuid) => {
        const radiosFiltered = new Map([...radios].filter(([radUuid, v]) => radUuid != uuid));
        setRadios(radiosFiltered);
    }

    const deleteAlbum = (uuid) => {

        // Filters out the track belonging to deleting album
        allTracksRef.current = allTracksRef.current.filter(track => track.album.uuid !==  uuid);
        console.log("Deleted album, remaining tracks", allTracksRef.current);
        allAlbumsRef.current = allAlbumsRef.current.filter(album => album.uuid !== uuid);
        setAvoidChangeWindowAlbum(false);
        setAlbums(allAlbumsRef.current);

    }
    const editAlbum = (uuid) => {
        setEditingAlbum(uuid);
    }

    useEffect(() => {
        if (editingAlbum === null || albums.length === 0) { setActiveIndex(2); return; };
        setActiveIndex(3);
    }, [editingAlbum]);

    /**
     * 
     * @param {Track} track 
     * @param {string} newAlbumName 
     */
    const moveTrackToNewAlbum = (track, newAlbumName) => {
        const newUuid = uuidv4();
        console.log("Moving track: " + track.id + +" from " + editingAlbum + " to album: " + newUuid);

        track.album.removeTrack(track);

        const newAlbum = new Album(newAlbumName, track.getArtists(), track.year, track.picture, newAlbumName);
        allAlbumsRef.current.push(newAlbum); //add the new album to the list
        newAlbum.addTrack(track);
        sanitizeAndApplyAlbums();
        addNotification(`Track ${track.title.substring(0, 60)} got moved to album ${newAlbumName}.`, notifTypes.INFO);
    }

    /**
     * 
     * @param {Track} track 
     * @param {string} newAlbumId 
     */
    const moveTrackToAlbum = (track, newAlbumId) => {
        console.log("Moving track: " + track.id + +" from " + editingAlbum + " to album: " + newAlbumId);

        track.album.removeTrack(track);

        const targetAlbumRef = allAlbumsRef.current.find(album => album.uuid === newAlbumId);
        targetAlbumRef.addTrack(track);

        sanitizeAndApplyAlbums();
        addNotification(`Track ${track.title.substring(0, 60)} got moved to album ${targetAlbumRef.name}.`, notifTypes.INFO);
    }



    const publish = async () => {
        console.log("Publishing tracks: ", allTracksRef.current);
        console.log("Publishing radios: ", radios);
        // RADIOS UPLOAD

        radios.keys().forEach(async radioUuid => {
            const radioData = new FormData();
            console.log(radios.get(radioUuid));
            radioData.append("radioData", JSON.stringify({ uuid: radioUuid, ...radios.get(radioUuid) }));
            const resRadio = await fetch(`${apiBase}/radio/newRadio`,
                { method: "POST", credentials: "include", body: radioData })
                .then(res => res.json());
            console.log(resRadio);
        })
        if (allTracksRef.current.length > 0) {
            setActiveIndex(4);

            for (const album of allAlbumsRef.current) {
                //Use let to clear mem
                let bodyAlbumFormData = new FormData();
                bodyAlbumFormData.append("album", JSON.stringify(album.getPuredData()));
                const albumCover = album.getPuredCover();
                if (albumCover) bodyAlbumFormData.append("cover",albumCover); 

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
                console.log("Album uploaded: " + album.name);

            }
            //album upload finished, we can revoke the covers etc:
            allAlbumsRef.current.forEach(album => {
                if (album.coverURL) {
                    URL.revokeObjectURL(album.coverURL);
                    album.coverURL = null; //revoke blob reference to destroy it
                }
            });

            let totalBytes = allTracksRef.current.reduce((acc, track) => acc + track.file.size, 0);
            setTotalMbUpload((totalBytes / 1024 / 1024).toFixed(1));

            // TRACK UPLOAD
            let i = 0;
            for (const track of allTracksRef.current) {
                 //Let : later clear the form data to free memory
                let bodyFormData = new FormData();
                bodyFormData.append("trackMeta", JSON.stringify(track.getPuredTrackMeta())); // Append the metadata, BEFORE the track, otherwise might not be populated yet
                bodyFormData.append("music", track.file); // Append each file individually
                setSendingFile(track.title);
                uploadProgress({ done: i, total: allTracksRef.current.length });
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
                .catch((error) => {
                    console.error("Error uploading track:", error);
                }).finally(()=> {
                    i++;
                });
                bodyFormData = null; //clear the form data to free memory
            }
        }

        console.log("Upload finished");
        uploadFinished();
        setTimeout(() => {
            allAlbumsRef.current = null;
            allTracksRef.current = null;
            setFinishedMeta(0);
            setAlbums([]);
            const radioCopy = radios;
            radioCopy.clear();
            setRadios(radioCopy);
            setActiveIndex(0);
            setEditingAlbum(null);
            setPercentageUpload(0);
            console.log("Closing overlay");
            emit("musicUploaded");
            closeOverlay();
        }, 750);

    }
    const handleClose = () => {
        if (activeIndex !== 4) {
            closeOverlay();
            return
        }
        setMinimized(true);
    }
    const MusicWindowState = () => {
        switch (activeIndex) {
            case 0:
                return <MusicSource fromFile={fromFile} setFromFile={setFromFile} tracksSelected={handleTracksSelected}
                    initMetadataFetching={fetchMetadata} />;
            case 1:
                return <Loading text={`Fetching metadatas.. ${(totalMeta) ? finishedMeta + '/' + totalMeta : "-/-"}`} />;
            case 2:
                return <AlbumsOverview albums={albums}
                    addNewMusic={() => setActiveIndex(0)} deleteAlbum={deleteAlbum}
                    editAlbum={editAlbum} publish={publish}
                    radios={radios} deleteRadio={deleteRadio} />;
            case 3:
                return <AlbumWrapping setEditUid={setEditingAlbum} albumClass={albums.find(album => album.uuid === editingAlbum)} />;
            case 4:
                return (<div style={{ padding: "20px" }}>
                    <Loading text={`Publishing ${sendingFile} ${totalMbUpload}Mb..`}
                        progressBar={{
                            useProgressBar: true, showPercent: true, isMarquee: false,
                            percent: Number(percentageUpload), fillColor: 'var(--cool-green)'
                        }} />
                    <p>You can close this overlay, the upload will continue. :)</p>
                </div>);
            default:
                return <div className="addMusicSource"><p>Not implemented yet</p></div>;
        }
    }
    return (
        <div className='addMusicRoot'>
            <div className="addMusicContainer" style={(isMinimize) ? { display: "none" } : {}}>
                <AddMusicContext.Provider value={{ albums, moveTrackToNewAlbum, editingAlbum, moveTrackToAlbum, setEditingAlbum }}>
                    <IconX className="buttonRound closeOverlay" onClick={handleClose} />
                    <h2>Add Music</h2>
                    <ActiveIndex context={{ name: "AddMusic", length: 5 }} active={activeIndex} setActive={setActiveIndex} />
                    < MusicWindowState />
                </AddMusicContext.Provider>
            </div>
        </div>
    )

}

export default AddMusic
export const useAddMusicContext = () => useContext(AddMusicContext);