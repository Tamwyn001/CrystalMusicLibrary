import { IconDots, IconHeart, IconHeartBroken, IconHeartFilled, IconPiano, IconRadio, IconSalad, IconSparkles, IconStar, IconVinyl } from "@tabler/icons-react";
import { useAudioPlayer } from "../GlobalAudioProvider.jsx";
import { parseAudioDuration } from "../../lib.js";
import SvgHoverToggle from "./SvgHoverToggle.jsx";
import { useEffect, useRef, useState } from "react";
import apiBase from "../../APIbase.js";
import { useEventContext } from "../GlobalEventProvider.jsx";

const TrackView = ({ index, track, playIconId, isSalad = null, onClick, showCover = false }) => {
  const { title, track_number, rawDuration } = track;
  const { playingTrack, openTrackActions, toggleTrackFavorite} = useAudioPlayer();
  const {subscribe} = useEventContext();
  const [ trackCoverURL, setTrackCoverUrl ] = useState('null');
  const [trackFavorite, setTrackFavorite] = useState(false);
  const [ actionsOpened, setActionsOpened] = useState(false);
  const [trackName, setTrackName] = useState("");
  const potentialSubscribeUpdateRef = useRef(null);
  const handleClick = () => { 
    if(isSalad){
      isSalad(index); 
      return
    }

    //this only happends into album/playlist view
    //we need to see if sorted after likes
    onClick(track.id);
  };
  const GetRandomPlayIcon = () => {
    switch (playIconId) {
      case 0:
        return <IconPiano className="track-number" playing="piano" data-show-cover={showCover}/>;
      case 1:
        return <IconVinyl className="track-number" playing="vinyl" data-show-cover={showCover}/>;
      case 2:
        return <IconRadio className="track-number" playing="piano" data-show-cover={showCover}/>;
      case 'salad':
        return <IconSalad className="track-number" playing="piano" data-show-cover={showCover}/>
    }
  };
  useEffect(() =>{
    setTrackFavorite(track.is_favorite === 1);
    if(showCover){
        fetch(`${apiBase}/read-write/trackCover/${track.id}`, {
          method: 'GET'
      })
      .then(response => response.json())
      .then(data => {setTrackCoverUrl(`${apiBase}/covers/${data}`);})
    };
    setTrackName(title);
    return () => {
      if(potentialSubscribeUpdateRef.current) potentialSubscribeUpdateRef.current?.(); 
    }
  },[])

  const toggleFavorite = (e) => {
    e.stopPropagation();
    toggleTrackFavorite(track.id, !trackFavorite, setTrackFavorite);
  };



  const looseFocusFromActionBar = () =>{
    setActionsOpened(false);
  }

  const clickDots = (event) =>{
    event.stopPropagation();
    setActionsOpened(true);
    openTrackActions({x:event.clientX, y: event.clientY}, track, looseFocusFromActionBar, toggleFavoriteCallback)
    potentialSubscribeUpdateRef.current = subscribe(`update-track-${track.id}`, upadteNameOnChangeInfos);
  }
  const upadteNameOnChangeInfos = (name) => {
    setTrackName(name);
    potentialSubscribeUpdateRef.current?.();
  }
  //when favorite set with actionbar, no direct connection, so we pass a callback
  const toggleFavoriteCallback = (newFavorite) => {
    setTrackFavorite(newFavorite);
  }

  return (
    <div className="track-view" action-bar={(actionsOpened) ? "open" : ''} onClick={handleClick}>
      {trackFavorite && <IconStar className="track-favorite" />}
      <SvgHoverToggle className={"track-toggle-favorite" }
        iconHovered={(!trackFavorite) ? IconHeartFilled : IconHeartBroken } 
        iconDefault={(!trackFavorite) ? IconHeart :  IconHeartBroken } 
        onClick={toggleFavorite}
     />
      {showCover ?  ((trackCoverURL.split('/').pop() === 'null') ? null :
        <img src={trackCoverURL} className="track-mini-thumbnail" />) : null}
      {(playingTrack === track.id) ? GetRandomPlayIcon() : showCover ? null : <p className="track-number">{track_number}</p> }
      <p className="track-name" style={{"--margin" : showCover ? "45px" : "35px" }}>{trackName}</p>
      <IconDots className={"track-actions-dots" } onClick={clickDots}/>
      <p className="track-length">{parseAudioDuration(rawDuration).readable}</p>
    </div>
  );
}
export default TrackView; 