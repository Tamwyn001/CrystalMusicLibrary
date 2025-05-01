import './ProgressBar.css';
const ProgressBar = ({percent, showPercent, isMarquee = false, fillColor = "#fffdff", style, initialising = false, onClickPercentage = null}) => {
    const calcClickedPrecent = (e) => { 
        if (initialising || (!onClickPercentage))  return;
        const progressBar = e.currentTarget;
        const rectX = progressBar.getBoundingClientRect().x;
        const userX = e.clientX;
        onClickPercentage((userX - rectX) / progressBar.clientWidth * 100);
        console.log((userX - rectX) / progressBar.clientWidth * 100);
    }
    return(
        <div className="progressBar" style={style} onClick={calcClickedPrecent}>
            <div className="progressFill" style={{width : `${percent}%`, backgroundColor : `${fillColor}`, ...style}}/>
        {(initialising)?
            <div className="progressFill" init="init" style={{ backgroundColor : 'white', opacity : '0.5', ...style}}/>
        :null}
           {showPercent && (<span className="progressPercent" style={{color : `black`}}>{percent + "%"}</span>)}
        </div>
    )
}
export default ProgressBar;