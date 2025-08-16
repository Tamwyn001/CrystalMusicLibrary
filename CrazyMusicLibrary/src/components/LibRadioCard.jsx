import apiBase from '../../APIbase';
import {trimString} from '../../lib';
import { useAudioPlayer } from '../GlobalAudioProvider';

import './AddMusic/AlbumCard.css';
import CML_logo from './CML_logo';


const LibRadioCard = ({radio}) => {
    const { playRadio, externalRadioInfos } = useAudioPlayer();
    return(
        <div className="album-card" onClick={()=> {
            if(!radio.id){
                externalRadioInfos.current = radio;
            } else {
                externalRadioInfos.current = null;
            }
            playRadio(
                radio.id ? `radio-id:${radio.id}` :
                `radio-url:${radio.url}`);
        }}>
            {(radio.coverUrl)?
            <img src={`${apiBase}/radio/favicon-proxy?url=${encodeURIComponent(radio.coverUrl)}`}
                alt={`${trimString(radio.name, 25)} cover`}
                className="album-card-cover" />
            : <CML_logo className="cover-image" />}
            <h3 className="album-name">{trimString(radio.name, 40)}</h3>
        </div>
    )
}

export default LibRadioCard;