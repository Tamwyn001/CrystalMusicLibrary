import { IconArrowsShuffle, IconDatabaseSearch, IconHeartSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react"
import ButtonWithCallback from "../components/ButtonWithCallback.jsx";
import apiBase from "../../APIbase.js";
import LibRadioCard from "../components/LibRadioCard.jsx";
import { asVerified, verifyToken } from "../../lib.js";

const Radio = () => {
    const [ radioFetched, setRadioFetched ] = useState(false);
    const [radios, setRadios] = useState([]);
    const [randomRadios, setRandomRadios] = useState([]);
    const SkeletonLoader = () => {
        return (
        <div className="album-card-loader loader-div">
            <div className="album-card-loader loader-img"></div>
            <div className="album-card-loader loader-text title"></div>
            <div className="album-card-loader loader-text "></div>
        </div>)
    } 
    useEffect(() => {
        const verify = asVerified(()=>{
            refetchRadios();
        });
        verify();     
    }, [])

    const refetchRadios = async () => {
        const res = await fetch(`${apiBase}/radio/radios`, {
                method : "GET",
                credentials : "include"})
            .then(res => res.json());
        setRadioFetched(true);
        setRadios(res);
        console.log("radios:", res);
    }

    const changeSearchQuery = () => {

    }

    const playRandomRadio = async () => {
        const res = await fetch(`${apiBase}/radio/stations`)
            .then(res => res.json()).then(json => JSON.parse(json));
        console.log(res);
        const pured = res.map(radio => {return {
            coverUrl: radio.favicon, name : radio.name, url : radio.url_resolved}})
        setRandomRadios(pured);
    }

    const externalSearch = async () =>{
        window.open("https://www.radio-browser.info/tags", '_blank').focus();
    }
    return(
        <div className="home">
            <h3>Recently heard</h3>
            <div className="album-displayer" data-flat={"true"} data-no-tracks={(radios?.length == 0 && radioFetched) ? "true" : "false"}>
            {!radioFetched?  
            <SkeletonLoader/>
            : radios?.length !== 0 ? radios.map((radio) => (
                <LibRadioCard key={radio.id} radio={radio}/>
            )) : null}

            </div>
            <div style={{display : "flex", flexDirection : "row", alignItems : "center", gap: "10px"}}>
                <h3 style={{marginRight : "20px"}}>Discover</h3>
                <ButtonWithCallback text={'Filters'} icon={<IconHeartSearch/>} onClick={changeSearchQuery}/>
                <ButtonWithCallback text={'Random'} icon={<IconArrowsShuffle />} onClick={playRandomRadio}/>
                <ButtonWithCallback text={'External search'} icon={<IconDatabaseSearch />} onClick={externalSearch}/>

            
            </div>
            <div className="album-displayer">
                {
                    randomRadios?.length !== 0 ? randomRadios.map((radio, id) => (
                <LibRadioCard key={id} radio={radio}/>)) : null
                }
            </div>
        </div>
    )
}
export default Radio;