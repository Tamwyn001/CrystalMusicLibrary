import { useNavigate } from "react-router-dom";

const GenreCard = ({genre}) =>{
    const navigate = useNavigate();
    return(
        <div className="genre-card" onClick={() => {navigate(`/genres/${genre.id}`)}}>
            <p>{genre.name}</p>
        </div>
    )
}

export default GenreCard;