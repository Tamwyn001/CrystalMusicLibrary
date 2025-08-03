import { IconDots, IconHeart, IconHeartBroken, IconHeartFilled, IconPiano, IconRadio, IconSalad, IconSparkles, IconVinyl } from "@tabler/icons-react";
import { useAudioPlayer } from "../GlobalAudioProvider";
import { parseAudioDuration } from "../../lib";
import SvgHoverToggle from "./SvgHoverToggle";
import { useEffect, useState } from "react";
import apiBase from "../../APIbase";

const TrackView = ({ index, track, playIconId, isSalad = null, onClick, showCover = false }) => {
  const { title, track_number, rawDuration } = track;
  const { playingTrack, openTrackActions} = useAudioPlayer();
  const trackName = track.id;
  const [ trackCoverURL, setTrackCoverUrl ] = useState('null');
  const [trackFavorite, setTrackFavorite] = useState(false);
  const [ actionsOpened, setActionsOpened] = useState(false);
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
    }
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
    openTrackActions({x:event.clientX, y: event.clientY}, track, looseFocusFromActionBar, toggleFavoriteCallback)

  }
  //when favorite set with actionbar, no direct connection, so we pass a callback
  const toggleFavoriteCallback = (newFavorite) => {
    setTrackFavorite(newFavorite);
  }

  return (
    <div className="track-view" action-bar={(actionsOpened) ? "open" : ''} onClick={handleClick}>
      {trackFavorite && <IconSparkles className="track-favorite" />}
      <SvgHoverToggle className={"track-toggle-favorite" }
        iconHovered={(!trackFavorite) ? IconHeartFilled : IconHeartBroken } 
        iconDefault={(!trackFavorite) ? IconHeart :  IconHeartBroken } 
        onClick={toggleFavorite}
     />
      {showCover ?  ((trackCoverURL.split('/').pop() === 'null') ? null :
        <img src={trackCoverURL} className="track-mini-thumbnail" />) : null}
      {(playingTrack === trackName) ? GetRandomPlayIcon() : showCover ? null : <p className="track-number">{track_number}</p> }
      <p style={{flexGrow : '1', marginLeft : showCover ? "45px" : "35px" }}>{title}</p>
      <IconDots className={"track-actions-dots" } onClick={clickDots}/>
      <p style={{paddingRight:'10px'}}>{parseAudioDuration(rawDuration).readable}</p>
    </div>
  );
}
export default TrackView; 