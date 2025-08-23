import { IconArrowsShuffle, IconDatabaseSearch, IconHeartSearch, IconStar, IconWorld, IconWorldBolt } from "@tabler/icons-react";
import { useEffect, useState } from "react"
import ButtonWithCallback from "../components/ButtonWithCallback.jsx";
import apiBase from "../../APIbase.js";
import LibRadioCard from "../components/LibRadioCard.jsx";
import { asVerified, verifyToken } from "../../lib.js";
import { useEventContext } from "../GlobalEventProvider.jsx";
import { useNotifications } from "../GlobalNotificationsProvider.jsx";

const SkeletonLoader = () => {
    return (
    <div className="album-card-loader loader-div">
        <div className="album-card-loader loader-img"></div>
        <div className="album-card-loader loader-text title"></div>
        <div className="album-card-loader loader-text "></div>
    </div>)
} 
const Radio = () => {
    const [ radioFetched, setRadioFetched ] = useState(false);
    const [radios, setRadios] = useState([]);
    const [randomRadios, setRandomRadios] = useState([]);
    const {subscribe} = useEventContext();
    const {addNotification, notifTypes} = useNotifications();
    

    useEffect(() => {
        const unsubscribe = subscribe("refetch-known-radios", refetchRadios);
        const verify = asVerified(()=>{
            refetchRadios();
        });
        verify();  
        return () => {unsubscribe()};   
    }, [])

    const refetchRadios = async () => {
        const res = await fetch(`${apiBase}/radio/radios`, {
                method : "GET",
                credentials : "include"})
        .then(res => res.json());
        setRadioFetched(true);
        const radios = res?.length > 0 ? res.map(radio => {
            return {...radio, uuid : radio.id}
        }) : [];
        setRadios(radios);
    }

    

    const changeSearchQuery = async () => {
        addNotification("Comming soon! :)", notifTypes.INFO);
    }

    const playRandomRadio = async () => {
        const res = await fetch(`${apiBase}/radio/stations`)
            .then(res => res.json()).then(json => JSON.parse(json));
        const pured = res.map(radio => {return {
            coverUrl: radio.favicon, name : radio.name,
            url : radio.url_resolved, uuid : radio.stationuuid}})
        setRandomRadios(pured);
    }

    const externalSearch = async () =>{
        window.open("https://www.radio-browser.info/tags", '_blank').focus();
    }
    return(
        <div className="home" id="radio-page">
            <div className="alligned-title-logo">
                <IconStar/>
                <h3>Favorite radios</h3>
                
            </div>
            <div className="album-displayer" id="fav-radios" data-flat={"true"} data-no-tracks={(radios?.length == 0 && radioFetched) ? "true" : "false"}>
            {!radioFetched ?  
            <SkeletonLoader/>
            : radios?.length > 0 ? radios.map((radio) => (
                <LibRadioCard key={radio.id} radio={radio}/>
            )) : null}

            </div>
    
                <div className="alligned-title-logo">
                    <IconWorldBolt/>
                    <h3 style={{marginRight : "20px"}}>Discover</h3>
                </div>
                <div className="track-list-header">
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