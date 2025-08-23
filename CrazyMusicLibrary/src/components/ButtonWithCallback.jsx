import { useState } from "react";
import ThreePointsLoader from "./ThreePointsLoader";
//onClick function should return a promise
const ButtonWithCallback = ({onClick, text, icon, style, id=""}) => {
    const [waitingForResult, setWaitingForResult] = useState(false);
    const handleClick = () => {
        setWaitingForResult(true);
        onClick()
            .then(() => {
                setWaitingForResult(false);
            });
    };
    const Inner = () => {
        if(waitingForResult){
            return <ThreePointsLoader />
        }else{
            return (
                <>
                    {icon}
                    {text}
                </>
            )
        }
    }
    return (
        <button className="button-with-callback" id={id} style={{...style}} onClick={handleClick}>
            <Inner />
        </button>
    );
}

export default ButtonWithCallback;
