import { useEffect, useRef, useState } from "react";
import ToggleButton from "../ToggleButton.jsx";
import InputNumber from "../InputNumber.jsx";
import apiBase  from "../../../APIbase.js";



const FFTSettings = () =>{
    const FFTSettingRef = useRef(null);
    const FPSRef = useRef(null);
    const DefRef = useRef(null);
    const WorkerRef = useRef(null);
    const [active, setActive] = useState(false);

    const changeFrameDef = (value) => {
        FFTSettingRef.current.samples = Math.floor(value);
        submit();
    }
    const changeFramePerSec = (value) => {
        FFTSettingRef.current.samplingInterval = 1/Math.floor(value);
        submit();
    }
    const changeParallelWorker = (value) => {
        FFTSettingRef.current.parallelCompute = Math.floor(value);
        submit();
    }

    const submit = () => {
        const data = new FormData();
        data.append("FFT", JSON.stringify(FFTSettingRef.current));
        fetch(`${apiBase}/config/send/FFT`, {
            method : "POST",
            credentials: "include",
            body : data
        })
    };

    const getBase = async () => {
        await fetch(`${apiBase}/config/FFT`, {
            method : "GET",
            credentials: "include"
        }).then(res => res.json())
        .then(data => {FFTSettingRef.current = data;})
        setActive(FFTSettingRef.current.useServerFFT);
        DefRef.current.value = FFTSettingRef.current.samples;
        FPSRef.current.value = Math.floor( 1 / FFTSettingRef.current.samplingInterval);
        WorkerRef.current.value = FFTSettingRef.current.parallelCompute;
    };


    useEffect(() => {
        getBase();
    }, []);

    return (<div className="admin-setting-entry-content">
        <div className="admin-setting-entry-line">
            <span>Activate audio spectra computation</span>
            <ToggleButton defaultValue={FFTSettingRef.current} active={active} setActive={(b) =>{
                setActive(b);
                if(FFTSettingRef.current){
                    FFTSettingRef.current.useServerFFT = b;
                    submit();
                }}}
            />
        </div>
        <div className="admin-setting-entry-line" data-is-enabled={active}>
            <span>Frame definiton (power of 2)</span>
            <InputNumber ref={DefRef} stateChanged={changeFrameDef} max={4096} min={0}/>
        </div>
        <div className="admin-setting-entry-line" data-is-enabled={active}>
            <span>Frame per second</span>
            <InputNumber ref={FPSRef} stateChanged={changeFramePerSec} max={120} min={0}/>
        </div>
        <div className="admin-setting-entry-line" data-is-enabled={active}>
            <span>Number of parallel analyzed songs</span>
            <InputNumber ref={WorkerRef} stateChanged={changeParallelWorker} max={10} min={1}/>
        </div>
    </div>)
};

export default FFTSettings;