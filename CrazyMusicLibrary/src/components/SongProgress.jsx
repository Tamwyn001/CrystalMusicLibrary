import './SongProgress.css';

const SongProgress = ({ currentTime, duration }) => {
    return(
        <div className="songProgress">
            <p>1:23</p>
            <div className="progressBar">
                <div className="progress"></div>
            </div>
            <p>3:45</p>
        </div>
    )
}

export default SongProgress;