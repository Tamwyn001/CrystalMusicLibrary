import './AlbumWrapping.css'

import { IconMountain } from '@tabler/icons-react';

const AlbumWrapping = () => {
    return(
        <div className="albumWrapping">
            <div className="albumCover">
                <IconMountain className='albumCoverImage'/>
            </div>
            <form className="albumDetails">
                <label htmlFor="albumName">Album name</label>
                <input type="text" id="albumName" placeholder="Enter album name" />
                <label htmlFor="artistName">Artist name</label>
                <input type="text" id="artistName" placeholder="Enter artist name" />
                <div className="albumType">
                    <div className="albumTypeOption">
                        <label htmlFor="releaseDate">Release date</label>
                        <input type="date" id="releaseDate" />
                    </div>
                    <div className="albumTypeOption">
                        <label htmlFor="genre">Genre</label>
                        <input type="text" id="genre" placeholder="Enter genre" />
                    </div>
                    <div className="albumTypeOption">
                        <label htmlFor="description">Description</label>
                        <textarea id="description" placeholder="Enter description"></textarea>
                    </div>
                    <div className="albumTypeOption">
                        <label htmlFor="genre">BPM</label>
                        <input type="number" id="genre" placeholder="Enter BPM" />
                    </div>
                </div>
            </form>
        </div>
    )
}

export default AlbumWrapping;
