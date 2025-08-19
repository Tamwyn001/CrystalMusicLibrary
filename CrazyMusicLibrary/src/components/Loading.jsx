
import ProgressBar from './ProgressBar';
import './Loading.css';
const Loading = ({text, progressBar = {useProgressBar: false}}) => {

    return (
        <div className="loading-container">

            <h2>{text}</h2>
            {(progressBar.useProgressBar) ? 
                <ProgressBar 
                    percent={progressBar.percent} 
                    showPercent={progressBar.showPercent} 
                    isMarquee={progressBar.isMarquee} 
                    fillColor = {progressBar.fillColor} 
                    style={{ height : '25px'}} /> :
                <p>Loading...</p>}
        </div>
    );
}

export default Loading;