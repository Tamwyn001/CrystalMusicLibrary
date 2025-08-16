import './ProgressBar.css';
const ProgressBar = ({percent, text=null, showPercent=false, isMarquee = false, fillColor = "#fffdff", style={}, initialising = false, initialisingColor="white", onClickPercentage = null, filter="", minWidth = 0}) => {
    const calcClickedPrecent = (e) => { 
        if (initialising || (!onClickPercentage))  return;
        const progressBar = e.currentTarget;
        const rectX = progressBar.getBoundingClientRect().x;
        const userX = e.clientX;
        onClickPercentage((userX - rectX) / progressBar.clientWidth * 100);
    }
    return(
        <div className="progressBar" style={{...style, minWidth : minWidth}} onClick={calcClickedPrecent}>
            <div className="progressFill" style={{width : `${percent}%`, background : `${fillColor}`, ...style}}/>
        {(initialising)?
            <div className="progressFill" init="init" style={{ backgroundColor : initialisingColor, opacity : '0.5', ...style}}/>
        :null}
           {showPercent && (<span className="progressPercent">{percent + "%"}</span>)}
           {text && (<span className="progressPercent" style={{ margin:"auto"}}>{text}</span>)}
        </div>
    )
}
export default ProgressBar;