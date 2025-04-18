import { useEffect, useState } from 'react';
import './AddMusic.css' 
import {IconX} from '@tabler/icons-react';
import ActiveIndex from './ActiveIndex';
import MusicSource from './AddMusic/MusicSource';
import Loading from './Loading';
import {parseBlob} from 'music-metadata';
import AlbumsOverview from './AddMusic/AlbumsOverview';


class Album{


    constructor(name, artist, year, tracks, cover){
        this.name = name;
        this.artist = artist;
        this.year = year;
        this.tracks = tracks;
        this.coverURL = this.setCover(cover);
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
    const [metadatas, setMetadatas] = useState([]);
    const [albums, setAlbums] = useState([]);

    const handleSetActiveIndex = (index) => {
        setActiveIndex(index);
    }
    const handleTracksSelected = (tracks) => {
        if (tracks.length === 0) return;
        setToAddTracks(tracks);
    }

    useEffect(() => { 
        if (toAddTracks.length === 0) return;
        setTimeout(() => {
            setFinishedMeta(0); 
            setActiveIndex(2);
        }, 1000);
    }, [albums]);

    const reconstructAlbums = () => {

        function findAlbumId(name){
            let i = 0;
            for(const album of localAlbums){
                if(album.name === name){
                    return i;
                }
                i++;
            }
            return -1;
        }

        
        let localAlbums = [];
        let counter = -1;
        for (const metadata of metadatas){
            counter++;
            const albumId = findAlbumId(metadata.common.album);
            if(albumId === -1){
                localAlbums.push(new Album(metadata.common.album, metadata.common.artist, metadata.common.year, [counter], metadata.common.picture?.[0]));
                continue;
            }
            localAlbums[albumId].tracks.push(counter);
            localAlbums[albumId].setCover(metadata.common.picture?.[0]);
        }
        setAlbums([...albums, ...localAlbums]);
    }

    useEffect(() => {
        if (toAddTracks.length === 0) return;
        reconstructAlbums();
    }, [metadatas]);

    const fetchMetadata = async () => {
        setActiveIndex(1);
        let localMetadatas = [];
        //fetch the filenames from the files and parse them
        await Promise.all(
            Array.from(toAddTracks).map(async (track) => {
                console.log(track);
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

        setMetadatas(localMetadatas);
       
    }

    const MusicWindowState = () => {
        switch(activeIndex){
            case 0:
                return <MusicSource fromFile={fromFile} setFromFile={setFromFile} tracksSelected={handleTracksSelected}
                    initMetadataFetching={fetchMetadata} />;
            case 1:
                return <Loading text={`Fetching metadata... ${finishedMeta}/${toAddTracks.length}`} />;
            case 2:
                return <AlbumsOverview albums={albums} addNewMusic={() => setActiveIndex(0)}/>;
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
