import { useEffect, useRef } from "react";
import { useGlobalActionBar } from "../GlobalActionBar.jsx";
import { IconBrightness } from "@tabler/icons-react";
import { capitalizeFirstLetter } from "../../lib.js";

const ColorThemeButton = ({useText = false, style={}}) =>{
    const colorThemeRef = useRef(null);
    const {colorTheme, toggleColorTheme} = useGlobalActionBar();
    useEffect(()=>{
        colorThemeRef.current.setAttribute("data-color-theme", colorTheme);
    },[colorTheme]);

    return (
    <div style={{display : "flex", flexDirection:"row", gap:"10px", alignItems:"center", ...style}}>
        <IconBrightness id="color-theme-svg" ref={colorThemeRef} className="buttonRound" onClick={toggleColorTheme}/>
        {useText && <span>{capitalizeFirstLetter(colorTheme.toString())}</span>}
    </div>)
}

export default ColorThemeButton;