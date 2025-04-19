import logo from '../assets/CML_logo.svg';
import ProgressBar from './ProgressBar';
import './Loading.css';
const Loading = ({text, progressBar = {useProgressBar: false}}) => {
    return (
        <div className="loading-container">
            <div className="loading-spinner">
                <img src={logo} alt="Loading..." />

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