import {trimString} from '../../lib';
import { useAudioPlayer } from '../GlobalAudioProvider';

import './AddMusic/AlbumCard.css';
import CML_logo from './CML_logo';


const LibRadioCard = ({radio}) => {
    const { playRadio } = useAudioPlayer();
    return(
        <div className="album-card" onClick={()=> playRadio(radio.id)}>
            {(radio.coverUrl)?
            <img src={`${radio.coverUrl}`} alt={`${trimString(radio.name, 25)} cover`} className="album-card-cover" />
            : <CML_logo className="cover-image" />}
            <h3 className="album-name">{trimString(radio.name, 40)}</h3>
        </div>
    )
}

export default LibRadioCard;