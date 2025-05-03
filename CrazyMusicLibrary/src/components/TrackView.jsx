import { IconPiano, IconRadio, IconVinyl } from "@tabler/icons-react";
import { useAudioPlayer } from "../GlobalAudioProvider";
import { parseAudioDuration } from "../../lib";

const TrackView = ({ index, track, containerId, isPlaylistView,playIconId }) => {
  const { title, track_number, rawDuration } = track;
  const {playTrack, playingTrack} = useAudioPlayer();
  const trackName = track.id
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
  }

  return (
    <div className="track-view" onClick={handleClick}>
      {(playingTrack === trackName) ? GetRandomPlayIcon() : <p className="track-number">{track_number}</p>}
      <p style={{flexGrow : '1'}}>{title}</p>
      <p style={{paddingRight:'10px'}}>{parseAudioDuration(rawDuration).readable}</p>
    </div>
  );
}
export default TrackView; 