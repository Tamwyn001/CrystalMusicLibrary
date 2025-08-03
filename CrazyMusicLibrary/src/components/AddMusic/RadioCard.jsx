import './AlbumCard.css';
import {trimString} from '../../../lib';
import {IconTrash} from "@tabler/icons-react";

const RadioCard = ({radio, deleteRadio}) => {
    console.log(radio);
    return(
        <div className="album-card" context={"add"}>
            <IconTrash className='album-card-overview-button' use="delete" onClick={() => deleteRadio(radio[0])} />
            <img src={radio[1].favicon == "" ? null : radio[1].favicon} className="album-card-cover" />
            <h3 className="album-name">{trimString(radio[1].name, 25)}</h3>
        </div>
    )
}

export default RadioCard;