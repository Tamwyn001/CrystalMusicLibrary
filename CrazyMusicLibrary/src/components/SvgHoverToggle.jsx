import { useState } from "react";

const SvgHoverToggle = ({iconHovered : IconHovered, iconDefault : IconDefault, onClick = null, className}) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div style={(onClick) ? {background: "rgba(0,0,0,0)"} : {}} className={`${className}`} onMouseEnter={()=> setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={onClick} >
           {isHovered ? <IconHovered /> : <IconDefault />}
        </div>
    )
}

export default SvgHoverToggle;