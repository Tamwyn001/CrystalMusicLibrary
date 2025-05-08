import './RadialProgressBar.css'

const RadialProgressBar = ({ percent, size = 120, strokeWidth = 10, useText = true, style, color="rgb(130, 119, 196)" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - percent);
  
    return (
      <div className="radial-container" style={{ width: size, height: size, ...style }}>
        <svg width={size} height={size}>
          <circle
            className="radial-bg"
            stroke="#e6e6e6"
            strokeWidth={strokeWidth}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
          />
          <circle
            className="radial-progress"
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="radial-label">
          {(useText) && <span>{Math.round(percent)}%</span>}
        </div>
      </div>
    );
  };
  
export default RadialProgressBar