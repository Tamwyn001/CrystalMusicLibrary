import { useNavigate } from "react-router-dom";
import './GenreCard.css'
import { use, useEffect, useRef, useState } from "react";
import apiBase from "../../APIbase";
import _ from "lodash";
import { IconPlayCard } from "@tabler/icons-react";
const GenreCard = ({genre}) =>{
    const navigate = useNavigate();
    const [ images, setImages ] = useState([]);
    const [ nextImages, setNextImages ] = useState([]);
    const nextImgRef = useRef(nextImages);
    useEffect(() => {
        getThreeRandomImages(setImages);
        setTimeout(() => {
            change(0, 500);
        }, 2000);
        setTimeout(() => {
            change(1, 500);
        }, 2500);
        setTimeout(() => {
            change(2, 500);
        }, 3000);
        refetchNextImg();
    }, []);
    const getThreeRandomImages = (func) => {
        fetch(`${apiBase}/read-write/trackCoversGenre/${genre.id}`, {method : "GET", credentials : "include"})
        .then(res => res.json())
        .then(imagesURLs => {
            func(imagesURLs);
        });
    }

    useEffect(() => {   
        nextImgRef.current = nextImages;
    }, [nextImages]);
    const refetchNextImg = () => {
        getThreeRandomImages(setNextImages);
        setTimeout(refetchNextImg, 5500);
    }

    const change = (id = 1, delay = 0) => {
        const currentImg = document.getElementById(`genre-${genre.id}-img-${id}`);
        currentImg?.setAttribute("data-hidden","true");
        setTimeout(() => {
            currentImg.src = `${apiBase}/covers/${nextImgRef.current[id]}`;
            currentImg?.removeAttribute("data-hidden");
        }, 500);
        setTimeout(() => {
            change(id);
        }, 7000 + delay);
    }
    return(
        <div className="genre-card" onClick={() => {navigate(`/genres/${genre.id}`)}}>
            {/* <IconPlayCard style={{position:"absolute", top : "50px", backgroundRepeat :"repeat"}}/> */}
            {images.map((imgPath, id)  => (
            <div key={id} className="img-pivot" style={{"--start-delay" : `${3 * (2-id)}`, "--start-angle" : `${2-id}`, "--speed" : "0.7", "--scale": 0.4}}>
                
                <img id={`genre-${genre.id}-img-${id}`} className="genre-img-cover" style={{"--scale": 0.7}} src={`${apiBase}/covers/${imgPath}`}/>
            </div>))} 
            <div className="genre-name">
                <p >{genre.name}</p>
            </div>
        </div>
    )
}

export default GenreCard;