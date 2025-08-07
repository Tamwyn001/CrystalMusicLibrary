import { useRef } from "react";

const InputNumber = ({stateChanged, min, max}) => {
    const userInputsRef = useRef(false);

    const change = (e) => {
        const value = e.target.value;
        if(value > max || value < min) {
            userInputsRef.current = true;
            e.target.value = Math.min(max, Math.max(min, value));
            change(e);
            return;
        }
        userInputsRef.current = false;
        stateChanged(value);
    }
    return (
       <input min={min} max={max} type="number" onChange={change}/>
    )
}

export default InputNumber