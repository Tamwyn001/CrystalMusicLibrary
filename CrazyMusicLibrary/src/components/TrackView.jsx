import { IconDots, IconHeart, IconHeartBroken, IconHeartFilled, IconPiano, IconRadio, IconSalad, IconSparkles, IconVinyl } from "@tabler/icons-react";
import { useAudioPlayer } from "../GlobalAudioProvider";
import { parseAudioDuration } from "../../lib";
import SvgHoverToggle from "./SvgHoverToggle";
import { useEffect, useState } from "react";
import apiBase from "../../APIbase";

const TrackView = ({ index, track, playIconId, isSalad = null }) => {
  const { title, track_number, rawDuration } = track;
  const { getNextSongsFromAlbum, playingTrack, openTrackActions,jumpToQueueTrack} = useAudioPlayer();
  const trackName = track.id;
  const [trackFavorite, setTrackFavorite] = useState(false);
  const [ actionsOpened, setActionsOpened] = useState(false);
  const handleClick = () => { 
    if(isSalad){isSalad(index); return}
    getNextSongsFromAlbum(index); 
  };
  const GetRandomPlayIcon = () => {
    switch (playIconId) {
      case 0:
        return <IconPiano className="track-number" playing="piano"/>;
      case 1:
        return <IconVinyl className="track-number" playing="vinyl"/>;
      case 2:
        return <IconRadio className="track-number" playing="piano"/>;
      case 'salad':
        return <IconSalad className="track-number" playing="piano"/>
    }
  };
  useEffect(() =>{
    setTrackFavorite(track.is_favorite === 1);
  },[])

  const toggleFavorite = (e) => {
    e.stopPropagation();
    
    fetch(`${apiBase}/read-write/toggleFavorite/${track.id}/${!trackFavorite}`,{
      method : 'GET',
      credentials: "include"
    })
    .then(res => res.json())
    .then((data) =>{
      setTrackFavorite(data);
    });

  };



  const looseFocusFromActionBar = () =>{
    setActionsOpened(false);
  }

  const clickDots = (event) =>{
    event.stopPropagation();
    setActionsOpened(true);
    openTrackActions({x:event.clientX, y: event.clientY}, track, looseFocusFromActionBar)

  }

  return (
    <div className="track-view" action-bar={(actionsOpened) ? "open" : ''} onClick={handleClick}>
      {trackFavorite && <IconSparkles className="track-favorite" />}
      <SvgHoverToggle className={"track-toggle-favorite" }
        iconHovered={(!trackFavorite) ? IconHeartFilled : IconHeartBroken } 
        iconDefault={(!trackFavorite) ? IconHeart :  IconHeartBroken } 
        onClick={toggleFavorite}
     />
      {(playingTrack === trackName) ? GetRandomPlayIcon() : <p className="track-number">{track_number}</p>}
      <p style={{flexGrow : '1'}}>{title}</p>
      <IconDots className={"track-actions-dots" } onClick={clickDots}/>
      <p style={{paddingRight:'10px'}}>{parseAudioDuration(rawDuration).readable}</p>
    </div>
  );
}
export default TrackView; 