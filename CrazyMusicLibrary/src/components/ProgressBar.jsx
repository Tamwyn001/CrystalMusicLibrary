import './ProgressBar.css';
const progressBar = ({percent, showPercent, isMarquee = false, fillColor = "#fffdff", style, initialising = false}) => {
    return(
        <div className="progressBar" style={style}>
            <div className="progressFill" style={{width : `${percent}%`, backgroundColor : `${fillColor}`, ...style}}/>
        {(initialising)?
            <div className="progressFill" init="init" style={{ backgroundColor : 'white', opacity : '0.5', ...style}}/>
        :null}
           {showPercent && (<span className="progressPercent" style={{color : `black`}}>{percent + "%"}</span>)}
        </div>
    )
}
export default progressBar;