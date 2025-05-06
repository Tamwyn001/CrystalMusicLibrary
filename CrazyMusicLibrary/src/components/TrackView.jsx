import { IconHeart, IconHeartBroken, IconHeartFilled, IconPiano, IconRadio, IconSparkles, IconVinyl } from "@tabler/icons-react";
import { useAudioPlayer } from "../GlobalAudioProvider";
import { parseAudioDuration } from "../../lib";
import SvgHoverToggle from "./SvgHoverToggle";
import { useState } from "react";
import apiBase from "../../APIbase";

const TrackView = ({ index, track, containerId, isPlaylistView, playIconId }) => {
  const { title, track_number, rawDuration } = track;
  const {playTrack, playingTrack} = useAudioPlayer();
  const trackName = track.id;
  const [trackFavorite, setTrackFavorite] = useState(Boolean(track.is_favorite));
  const handleClick = () => { 
    playTrack(trackName, containerId, isPlaylistView, index ); // Extract the file name from the path
  };
  const GetRandomPlayIcon = () => {
    switch (playIconId) {
      case 0:
        return <IconPiano className="track-number" playing="piano"/>;
      case 1:
        return <IconVinyl className="track-number" playing="vinyl"/>;
      case 2:
        return <IconRadio className="track-number" playing="piano"/>;
    }
  };

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

  return (
    <div className="track-view" onClick={handleClick}>
      {trackFavorite && <IconSparkles className="track-favorite" />}
      <SvgHoverToggle className={"track-toggle-favorite" }
        iconHovered={(!trackFavorite) ? IconHeartFilled : IconHeartBroken } 
        iconDefault={(!trackFavorite) ? IconHeart :  IconHeartBroken } 
        onClick={toggleFavorite}
     />
      {(playingTrack === trackName) ? GetRandomPlayIcon() : <p className="track-number">{track_number}</p>}
      <p style={{flexGrow : '1'}}>{title}</p>
      <p style={{paddingRight:'10px'}}>{parseAudioDuration(rawDuration).readable}</p>
    </div>
  );
}
export default TrackView; 