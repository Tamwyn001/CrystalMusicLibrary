import { IconBusStop, IconClockPause, IconClockPlay, IconRun } from "@tabler/icons-react";
import "./BackendJob.css"
import ProgressBar from "./ProgressBar";
import ButtonWithCallback from "./ButtonWithCallback";
import { useEffect, useRef, useState } from "react";
import apiBase from "../../APIbase";

const JobStatus = {
    PENDING : "pending",
    RUNNING : "running",
    PAUSED : "paused",
    INACTIVE : "inactive"
}

const BackendJob = ({jobName, description, jobKey}) => {

    const  [isProcessRuning, setProcessRunning] = useState(false);  
    const [isPaused, setIsPaused ] = useState(true);
    const [percent, setPercent ] = useState(0);
    const [initialising, setInitialiasing] = useState(false);
    const [progress, setProgress] = useState(null);
    const statusTimeoutRef = useRef(null);

    const refetchStatus = (timeout = true, lastState = '', lastTotal = 0) => {
        var localTimeout = timeout;
        fetch(`${apiBase}/jobs/status/${jobKey}`, { method: "GET", credentials: "include" })
            .then(res => res.json())
            .then(res => {
                setInitialiasing(false);
                console.log("Refetching with", res.status, lastState);
                
    
                let delay = 1000; // default delay
    
                switch (res.status) {
                    case JobStatus.PENDING:
                        setInitialiasing(true);
                        setProcessRunning(true);
                        setIsPaused(false);
                        delay = 500;
                        break;
    
                    case JobStatus.INACTIVE:

                        // Just finished job
                        if( lastState === JobStatus.RUNNING ||  lastState === JobStatus.PENDING ){
                            setTimeout(() => {
                                setProcessRunning(false);
                                setPercent(0);
                                setProgress(null);
                                refetchStatus(false, res.status)
                            }, 2000 );
                            setPercent(100);
                            setProgress({done : lastTotal, total : lastTotal});
                            localTimeout = false;
                            console.log("espace");
                            return;
                        }
                        setProcessRunning(false);
                        // delay the **next status check** to match the UI delay
                        // delay = lastState === JobStatus.RUNNING ? 1 : 1000;
                        break;
    
                    case JobStatus.PAUSED:
                        setIsPaused(true);
                        setProcessRunning(true);
                        delay = 500;
                        break;
    
                    case JobStatus.RUNNING:
                        setIsPaused(false);
                        setProcessRunning(true);
                        delay = 10;
                        console.log("fast refresh");
                        break;
                }
                
                if (statusTimeoutRef.current) {
                    clearTimeout(statusTimeoutRef.current);
                    statusTimeoutRef.current = null;
                }
                if (localTimeout) {
                    statusTimeoutRef.current = setTimeout(() => {
                        if (res.progress) {
                            console.log(res.progress);
                            const rawPercent = res.progress.done / res.progress.total * 100;
                            setPercent(rawPercent);
                            setProgress(res.progress);
                        } else {
                            setProgress(null);
                        }
                        refetchStatus(true, res.status, res.progress?.total ?? 0);
                    }, delay);
                }
            });
    };
    

    const run = () =>{
        fetch(`${apiBase}/jobs/run/${jobKey}`, {method : "GET", credentials: "include"})
        .then(res => res.json())
        .then(res => {
            refetchStatus(true);
        })
    }

    const pause = () =>{
        fetch(`${apiBase}/jobs/pause/${jobKey}`, {method : "GET", credentials: "include"})
        .then(res => res.json())
        .then(res => {
            refetchStatus(false);
        })
    }
    const stop = () =>{
        fetch(`${apiBase}/jobs/stop/${jobKey}`, {method : "GET", credentials: "include"})
        .then(res => res.json())
        .then(res => {
            refetchStatus(false);
        })
    }
    useEffect(()=>{
        refetchStatus(false);
        return () => {
            if(statusTimeoutRef.current){
                console.log("trying clearTimout");
                clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = null;
            }
        }
    },[])


    const toggleResumePause = async () =>{
        if(isProcessRuning){
            if(isPaused){ run(); } else{ pause(); }
            setIsPaused(!isPaused);
            return;
        }
        run();

        // setProcessRunning(true);
        // setInitialiasing(true);
        // setTimeout(()=>{
        //     setPercent(40);
        //     setInitialiasing(false);
        //     setIsPaused(false);
        // }, 3000);
    }
    const abort = async () =>{
        stop();
        setPercent(0);
    }

    return(
        <div className="backend-job">
            <h3>{jobName}</h3>
            <div style={{display : "flex", flexDirection:"row", gap:"10px", alignItems: "baseline"}}>
                <ButtonWithCallback text={isProcessRuning ? (isPaused ? 'Resume' : 'Pause') : 'Run'} 
                    icon={isProcessRuning ? (isPaused ? <IconClockPlay/> : <IconClockPause/>) : <IconRun/>}
                    onClick={toggleResumePause}/>
                <ButtonWithCallback text={'Stop'} icon={<IconBusStop/>} onClick={abort}/>
                <ProgressBar style={{height : "20px", filter: `grayscale(${isPaused && isProcessRuning ? 0.8 : 0 })`}} 
                    percent={percent} 
                    showPercent={false}
                    text={progress ? `${progress.done}/${progress.total}` : null}
                    fillColor="linear-gradient(90deg, rgb(187, 251, 223) 0%, rgb(198, 203, 253) 50%, rgb(239, 201, 249) 100%)"
                    initialising={initialising}
                    initialisingColor="violet"/>

            </div>
            <p>{description}</p>
            <div className="job-status" data-running={isPaused ? "false" : "true"}
                 style={{backgroundColor : isProcessRuning ? initialising ? "purple" : (isPaused ? "red": "green"):"grey" }}>
                <span>
                    {isProcessRuning ?( initialising ? "Initlialising" : (isPaused ? "Paused": "Running" )): "Inactive"}
                </span>
            </div>
        </div>
    )
}
export default BackendJob;