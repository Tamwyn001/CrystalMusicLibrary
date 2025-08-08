import { useRef } from "react";

const InputNumber = ({stateChanged, min=0, max=0, ref}) => {
    const noRange =  (min === max && max === 0);
    const handleChange = (e) => {
        const value = e.target.value;
        stateChanged(value); // Let them type anything for now
    };
    
    const handleBlur = (e) => {
        console.log("blur");
        let value = parseFloat(e.target.value);
        if (isNaN(value)) value = min; // fallback if input is empty or invalid
        if(!noRange){
            value = Math.min(max, Math.max(min, value)); // clamp
        }
        e.target.value = value;
        stateChanged(value); // update with clamped value
    };
    return (noRange ? <input ref={ref}  type="number" onBlur={handleBlur} onChange={handleChange}/>
        :
       <input min={min} ref={ref} max={max} type="number" onBlur={handleBlur} onChange={handleChange}/>
    )
}

export default InputNumber