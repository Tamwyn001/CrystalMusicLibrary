import { useAudioPlayer } from "../GlobalAudioProvider";

const TrackView = ({ track }) => {
  const { title, path, track_number } = track;
  const {playTrack} = useAudioPlayer();
  const handleClick = () => { 
    playTrack(path.split("\\").pop()); // Extract the file name from the path
  };

  return (
    <div className="track-view" onClick={handleClick}>
      <p>{track_number}</p>
      <p>{title}</p>
    </div>
  );
}
export default TrackView; 