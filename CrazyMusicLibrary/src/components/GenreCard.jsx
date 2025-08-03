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
    const timeoutsRef = useRef([]);
    const nextImgRef = useRef(nextImages);
    const intervalRefs = useRef([]);

    const change = (id) => {
        console.log("changed on", id);
        if(!nextImgRef.current?.length == 0){
            return;
        }
        const currentImg = document.getElementById(`genre-${genre.id}-img-${id}`);
        currentImg?.setAttribute("data-hidden", "true");
        setTimeout(() => {
          if (currentImg) {
            currentImg.src = `${apiBase}/covers/${nextImgRef?.current[id]}`;
          }
          currentImg?.removeAttribute("data-hidden");
        }, 500);
      };
    
      useEffect(() => {
        getThreeRandomImages(setImages);
        refetchNextImg();
    
        const delays = [2000, 2500, 3000];
        delays.forEach((delay, id) => {
          // Call it once after initial delay
          setTimeout(() => change(id), delay);
    
          // Then call it repeatedly every 7s
          const interval = setInterval(() => change(id), 7000);
          intervalRefs.current.push(interval);
        });
        return () => {
            timeoutsRef.current.forEach(clearTimeout);
            timeoutsRef.current = [];
            intervalRefs.current.forEach(clearInterval);
            intervalRefs.current = [];
            nextImgRef.current = [];
          };
        }, 
    []);

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