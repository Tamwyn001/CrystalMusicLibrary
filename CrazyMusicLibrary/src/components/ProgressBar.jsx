import './ProgressBar.css';
const progressBar = ({percent, showPercent, isMarquee = false, fillColor = "#fffdff", style}) => {
    return(
        <div className="progressBar" style={style}>
            <div className="progressBar">
                <div className="progressFill" style={{width : `${percent}%`, backgroundColor : `${fillColor}`}}></div>
            </div>
            {showPercent && (<span className="progressPercent" style={{color : `black`}}>{percent + "%"}</span>)}
        </div>
    )
}
export default progressBar;