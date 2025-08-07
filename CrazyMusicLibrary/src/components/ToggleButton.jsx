import { useState } from "react"

const ToggleButton = ({stateChanged}) => {
    const [active, setIsActive] = useState(false)
    return (
    <div className="toggle-button" data-is-active={active} onClick={(e) => {
        e.stopPropagation();
        stateChanged(!active);
        setIsActive(!active); }}>
        <div className="toggle-button-active" data-is-active={active}/>
    </div>
    )
}

export default ToggleButton