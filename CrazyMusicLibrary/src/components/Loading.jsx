
import ProgressBar from './ProgressBar';
import './Loading.css';
import CML_logo from './CML_logo';
const Loading = ({text, progressBar = {useProgressBar: false}}) => {
    return (
        <div className="loading-container">
            <div className="loading-spinner">
                <CML_logo />

            </div>
            <h1>{text}</h1>
            {(progressBar.useProgressBar) ? 
                <ProgressBar 
                    percent={progressBar.percent} 
                    showPercent={progressBar.showPercent} 
                    isMarquee={progressBar.isMarquee} 
                    fillColor = {progressBar.fillColor} 
                    style={{width: "500px"}} /> :
                <p>Loading...</p>}
        </div>
    );
}

export default Loading;