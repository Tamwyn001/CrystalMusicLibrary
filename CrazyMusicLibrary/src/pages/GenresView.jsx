import { useEffect, useState } from "react";
import apiBase from "../../APIbase.js";

import GenreCard from "../components/GenreCard.jsx";
import { AddMusicShortcut } from "../components/AddMusicShortcut.jsx";
import { asVerified } from "../../lib.js";

import Fuse from "fuse.js";
import {TutorialWraper, TutorialKeys} from "./TutorialWraper.jsx";
import { useEventContext } from "../GlobalEventProvider.jsx";
import { IconInfoCircle } from "@tabler/icons-react";


//Later can add a wallpaper object etc..
const genres = [
  { name: "rock" },
  { name: "hiphop"},
  { name: "jazz"},
  { name: "edm"},
  { name: "house"},
  { name: "techno"},
  { name: "trance"},
  { name: "dubstep"},
  { name: "reggae"},
  { name: "ska"},
  { name: "country"},
  { name: "folk"},
  { name: "acoustic"},
  { name: "singer"},
  { name: "songwriter"},
  { name: "latin"},
  { name: "salsa"},
  { name: "reggaeton"},
  { name: "afrobeat"},
  { name: "jpop"},
  { name: "jpop"},
  { name: "lofi"},
  { name: "electronic"},
  { name: "indie"},
  { name: "alternative"},
  { name: "punk"},
  { name: "metal"},
  { name: "opera"},
  { name: "classical"},
  { name: "funk"},
  { name: "blues"},
  { name: "soul"},
  { name: "rnb"},
  { name: "chillhop"},
  { name: "ambiant"},
  { name: "soundtrack"},
  { name: "art-rock"},
  {name: "pop-rock"},
  {name: "breakcore"},
  {name: "worldwide"},
  {name: "rnb-soul"},
  {name: "hard-rock"},
  {name: "shoegaze"},
  {name: "indie-rock"},
  {name: "traditional"},
  {name: "anime"},
  {name: "pop"}
];

const fuse = new Fuse(genres, { keys: ["name"], threshold: 0.4 });

const getGenreWallpaper = (userGenre) => {
    const pured = userGenre.replace(/[^a-zA-Z ]/g, " ")
    const result = fuse.search(pured);
    return "genre-" + (result.length > 0 ? result[0].item.name : "default");
}

const GenresView = ({}) => {
    const {subscribe } = useEventContext();
    const [genresData, setGenresData] = useState([]);
    const [tutoGenreFinished, setTutoGenreFinished] = useState(() => {
        const tuto = localStorage.getItem("CML_FinishedTutorials");
        if (!tuto) return false;
        const data = JSON.parse(tuto);
        return data.state[TutorialKeys.GENRES] || false;   

    });
    const refetch = () => {
        fetch(`${apiBase}/read-write/genres`, {
            method: "GET",
            credentials: "include"
        }).then(res => res.json())
        .then(data => {
                data.genres = data.genres.map(genre => {
                return {...genre, puredName : getGenreWallpaper(genre.name)}
            });
            setGenresData(data);
        })
    }
    useEffect(() =>{
        const unsubscribeTutorial = subscribe(`safe-finished-tutorial-${TutorialKeys.GENRES}`, () => {
            setTutoGenreFinished(true);
        })

        const unsubscribeMusicUploaded = subscribe("musicUploaded", refetch);
        const verify = asVerified(() => {
            refetch();
        });
        verify();
        return () => {
            unsubscribeMusicUploaded();
            unsubscribeTutorial()
        }; 
    }
    ,[]);

    return( <>
        {genresData?.genres?.length !== 0 ?
            <div className="home genre-displayer">
                {genresData?.genres?.map((genre) => (
                    <GenreCard key={genre.id} genre={genre}/>
                ))}
            </div> :
            (genresData?.trackNum > 0  ? 
                ( tutoGenreFinished ?
                    <div className="info-line" id="text-no-genre">                    
                        <span>No genres found in the library.</span>
                        <IconInfoCircle className="info-button" onClick={()=>{setTutoGenreFinished(false)}}/>
                    </div>

                    : <TutorialWraper tutorialKey={TutorialKeys.GENRES}/>)
                :
            <AddMusicShortcut/>)
        }
        
        </>
    )
}

export default GenresView;