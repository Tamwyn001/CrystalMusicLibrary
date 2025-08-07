import { useState } from "react";
import ToggleButton from "../ToggleButton";
import InputNumber from "../InputNumber";



const FFTSettings = () =>{
    const [FFTenabled, setFFTenabled] = useState(false);

    const changeFrameDef = (value) => {
        console.log(value);
    }
    const changeFramePerSec = (value) => {
        console.log(value);

    }
    const changeParallelWorker = (value) => {

    }
    return (<div className="admin-setting-entry-content">
        <div className="admin-setting-entry-line">
            <span>Activate audio spectra computation</span>
            <ToggleButton stateChanged={setFFTenabled}/>
        </div>
        <div className="admin-setting-entry-line" data-is-enabled={FFTenabled}>
            <span>Frame definiton (power of 2)</span>
            <InputNumber stateChanged={changeFrameDef} max={4096} min={0}/>
        </div>
        <div className="admin-setting-entry-line" data-is-enabled={FFTenabled}>
            <span>Frame per second</span>
            <InputNumber stateChanged={changeFramePerSec} max={120} min={0}/>
        </div>
        <div className="admin-setting-entry-line" data-is-enabled={FFTenabled}>
            <span>Number of parallel analyzed songs</span>
            <InputNumber stateChanged={changeParallelWorker} max={10} min={1}/>
        </div>
    </div>)
};

export default FFTSettings;