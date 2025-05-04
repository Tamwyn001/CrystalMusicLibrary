
import ProgressBar from './ProgressBar';
import './Loading.css';
import CML_logo from './CML_logo';
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
                    style={{width: "500px", height : '25px'}} /> :
                <p>Loading...</p>}
        </div>
    );
}

export default Loading;