const TrackView = ({ track }) => {
  const { title, id } = track;

  return (
    <div className="track-view">
        <p>{title}</p>
        <p>{id}</p>
        {/* <p>{album}</p>     */}
    </div>
  );
}
export default TrackView;