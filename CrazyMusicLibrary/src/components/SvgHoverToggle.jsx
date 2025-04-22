import { useState } from "react";

const SvgHoverToggle = ({iconHovered : IconHovered, iconDefault : IconDefault, onClick = null}) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div onMouseEnter={()=> setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={onClick} >
           {isHovered ? <IconHovered /> : <IconDefault />}
        </div>
    )
}

export default SvgHoverToggle;