import { useState } from "react"

const ToggleButton = ({active, setActive}) => {
    
    return (
    <div className="toggle-button" data-is-active={active} onClick={(e) => {
        e.stopPropagation();
        setActive(!active); }}>
        <div className="toggle-button-active" data-is-active={active}/>
    </div>
    )
}

export default ToggleButton