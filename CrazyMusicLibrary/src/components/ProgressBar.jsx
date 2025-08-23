import { memo, useEffect, useRef } from "react";
import './ProgressBar.css'
const ProgressBar = memo(
    ({
      percent,
      text = null,
      showPercent = false,
      isMarquee = false,
      fillColor = "#fffdff",
      style = {},
      initialising = false,
      initialisingColor = "white",
      onClickPercentage = null,
      minWidth = 0,
    }) => {
      const progressRef = useRef(null);
  
      const calcClickedPercent = (e) => {
        if (initialising || !onClickPercentage) return;
        const progressBar = e.currentTarget;
        const rectX = progressBar.getBoundingClientRect().x;
        const userX = e.clientX;
        onClickPercentage(
          ((userX - rectX) / progressBar.clientWidth) * 100
        );
      };
  
      // Imperative update on percent
      useEffect(() => {
        if (progressRef.current) {
          progressRef.current.style.setProperty("--progress", `${percent}%`);
        }
      }, [percent]);
  
      return (
        <div
          className="progressBar"
          style={{ ...style, minWidth }}
          onClick={calcClickedPercent}
        >
          <div
            className="progressFill"
            ref={progressRef}
            style={{
              background: fillColor,
              ...style,
            }}
          />
          {initialising && (
            <div
              className="progressFill"
              init="init"
              style={{
                backgroundColor: initialisingColor,
                opacity: 0.5,
                ...style,
              }}
            />
          )}
          {showPercent && (
            <span className="progressPercent">{percent + "%"}</span>
          )}
          {text && (
            <span
              className="progressPercent"
              style={{ margin: "auto" }}
            >
              {text}
            </span>
          )}
        </div>
      );
    },
    (prev, next) =>{
        // console.log(prev.percent);
      return prev.text === next.text &&
      prev.initialising === next.initialising
    &&  prev.percent === next.percent } // percent ignored
  );
  
export default ProgressBar;
  