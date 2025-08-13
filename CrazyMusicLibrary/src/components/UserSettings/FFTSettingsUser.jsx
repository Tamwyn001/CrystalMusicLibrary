import { useEffect, useRef, useState } from "react";
import ToggleButton from "../ToggleButton.jsx";
import InputNumber from "../InputNumber.jsx";
import apiBase  from "../../../APIbase.js";
import { useAudioPlayer } from "../../GlobalAudioProvider.jsx";



const FFTSettingsUser = () =>{
    const BarsRef = useRef(null);
    const ScaleRef = useRef(null);
    const FPSRef = useRef(null);
    const ContrastRef = useRef(null);
    const CutoffRef = useRef(null);
    const {FFTUserSetingsRef, fftConfigRef} = useAudioPlayer();

    const changeBars = (value) => {
        FFTUserSetingsRef.current.bars = Math.floor(value);
        submit();
    }

    const changeCutoff = (value) => {
        FFTUserSetingsRef.current.cutoff = parseFloat(value);
        submit();
    }
    const changeScale = (value) => {
        FFTUserSetingsRef.current.scale = parseFloat(value);
        submit();
    }
    const changeContrast = (value) => {
        FFTUserSetingsRef.current.contrast = parseFloat(value);
        submit();
    }
    const changeFPS= (value) => {
        FFTUserSetingsRef.current.FPS = parseFloat(value);
        submit();
    }


    const submit = () => {
        const data = new FormData();
        data.append("FFT", JSON.stringify(FFTUserSetingsRef.current));
        fetch(`${apiBase}/config/user/send/FFT`, {
            method : "POST",
            credentials: "include",
            body : data
        });
    };

    const getBase = async () => {
        await fetch(`${apiBase}/config/user/FFT`, {
            method : "GET",
            credentials: "include"
        }).then(res => res.json())
        .then(data => {
            FFTUserSetingsRef.current = data
            BarsRef.current.value = FFTUserSetingsRef.current.bars;
            ContrastRef.current.value = FFTUserSetingsRef.current.contrast;
            ScaleRef.current.value = FFTUserSetingsRef.current.scale;
            CutoffRef.current.value = FFTUserSetingsRef.current.cutoff;
            FPSRef.current.value = FFTUserSetingsRef.current.FPS;

        });
    };


    useEffect(() => {
        getBase();
    }, []);

    return (<div className="admin-setting-entry-content">
        {/* <div className="admin-setting-entry-line">
            <span>Activate audio spectra computation</span>
            <ToggleButton defaultValue={FFTSettingRef.current} active={active} setActive={(b) =>{
                setActive(b);
                if(FFTSettingRef.current){
                    FFTSettingRef.current.useServerFFT = b;
                    submit();
                }}}
            />
        </div> */}
        <div className="admin-setting-entry-line" data-is-enabled={true}>
            <span>Number of bars</span>
            <InputNumber ref={BarsRef} stateChanged={changeBars} min={1} max={fftConfigRef.current?.fftSize}/>

        </div>
        <div className="admin-setting-entry-line" data-is-enabled={true}>
            <span>FPS (High number may cause strong battery usage)</span>
            <InputNumber ref={FPSRef} stateChanged={changeFPS} />

        </div>
        <div className="admin-setting-entry-line" data-is-enabled={true}>
            <span>Scale</span>
            <InputNumber ref={ScaleRef} stateChanged={changeScale} />
        </div>
        <div className="admin-setting-entry-line" data-is-enabled={true}>
            <span>Contrast</span>
            <InputNumber ref={ContrastRef} stateChanged={changeContrast} />

        </div>
        <div className="admin-setting-entry-line" data-is-enabled={true}>
            <span>Cutoff</span>
            <InputNumber ref={CutoffRef} stateChanged={changeCutoff} />

        </div>

        
        {/* <div className="admin-setting-entry-line" data-is-enabled={active}>
            <span>Frame per second</span>
            <InputNumber ref={FPSRef} stateChanged={changeFramePerSec} max={120} min={0}/>
        </div>
        <div className="admin-setting-entry-line" data-is-enabled={active}>
            <span>Number of parallel analyzed songs</span>
            <InputNumber ref={WorkerRef} stateChanged={changeParallelWorker} max={10} min={1}/>
        </div> */}
    </div>)
};

export default FFTSettingsUser;