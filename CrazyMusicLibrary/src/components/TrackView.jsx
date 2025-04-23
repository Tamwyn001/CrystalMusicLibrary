import { IconPiano, IconRadio, IconVinyl } from "@tabler/icons-react";
import { useAudioPlayer } from "../GlobalAudioProvider";

const TrackView = ({ track, containerId, isPlaylistView,playIconId }) => {
  const { title, track_number } = track;
  const {playTrack, playingTrack} = useAudioPlayer();
  const trackName = track.path.split('\\').pop()
  const handleClick = () => { 
    playTrack(trackName, containerId, isPlaylistView ); // Extract the file name from the path
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
      <p>{title}</p>
    </div>
  );
}
export default TrackView; 