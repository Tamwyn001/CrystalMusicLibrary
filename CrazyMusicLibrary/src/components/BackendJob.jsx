import { IconBusStop, IconClockPause, IconClockPlay, IconRun } from "@tabler/icons-react";
import "./BackendJob.css"
import ProgressBar from "./ProgressBar";
import ButtonWithCallback from "./ButtonWithCallback";
import { useEffect, useRef, useState } from "react";
import apiBase from "../../APIbase";
import { words } from "lodash";

const JobStatus = {
    PENDING : "pending",
    RUNNING : "running",
    PAUSED : "paused",
    INACTIVE : "inactive"
}

const BackendJob = ({jobName, description, jobKey, payload={}, doneTotalView = null}) => {

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
                // console.log("Refetching with", res.status, lastState);
                
    
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
                            setProgress({done : lastTotal, total : lastTotal, working : 0});
                            localTimeout = false;
                            console.log("Stop fast fetch job");
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
                        break;
                }
                
                if (statusTimeoutRef.current) {
                    clearTimeout(statusTimeoutRef.current);
                    statusTimeoutRef.current = null;
                }
                if (localTimeout) {
                    statusTimeoutRef.current = setTimeout(() => {
                        if (res.progress) {
                            // console.log(res.progress);
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
    
    /**
     * First simple check on startup, if it runs, we proceed with a auto refresh
     */
    const simpleRefetch = () => {
        fetch(`${apiBase}/jobs/status/${jobKey}`, { method: "GET", credentials: "include" })
        .then(res => res.json())
        .then(res => {
            //This would be false by default
            refetchStatus(res.status === JobStatus.RUNNING);
        });
    };

    const run = () =>{
        const data = new FormData();
        data.append("payload", JSON.stringify(payload));
        fetch(`${apiBase}/jobs/run/${jobKey}`, {method : "POST", credentials: "include", body: data})
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
    const resume = () =>{
        fetch(`${apiBase}/jobs/resume/${jobKey}`, {method : "GET", credentials: "include"})
        .then(res => res.json())
        .then(res => {
            refetchStatus(true);
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
        simpleRefetch();
        return () => {
            if(statusTimeoutRef.current){
                console.log("Trying clearTimout");
                clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = null;
            }
        }
    },[])


    const toggleResumePause = async () =>{
        if(isProcessRuning){
            if(isPaused){ resume(); } else{ pause(); }
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
            <div style={{display : "flex", flexDirection:"row", gap:"10px", alignItems: "baseline", flexWrap :"wrap"}}>
                <ButtonWithCallback text={isProcessRuning ? (isPaused ? 'Resume' : 'Pause') : 'Run'} 
                    icon={isProcessRuning ? (isPaused ? <IconClockPlay/> : <IconClockPause/>) : <IconRun/>}
                    onClick={toggleResumePause}/>
                <ButtonWithCallback text={'Stop'} icon={<IconBusStop/>} onClick={abort}/>
                <ProgressBar style={{height : "25px", filter: `grayscale(${isPaused && isProcessRuning ? 0.8 : 0 })`}}
                    minWidth = {"200px"}
                    percent={percent} 
                    showPercent={false}
                    text={progress ? (doneTotalView.current ? `${progress.done}/${progress.total}` :
                        `Working: ${progress.working} | Left : ${progress.total - progress.done}`) : null}
                    fillColor="linear-gradient(90deg, rgb(187, 251, 223) 0%, rgb(198, 203, 253) 50%, rgb(239, 201, 249) 100%)"
                    initialising={initialising}
                    initialisingColor="violet"/>

            </div>
            <p>{description}</p>
            <div className="job-status" data-running={isPaused ? "false" : "true"}
                 data-status={isProcessRuning ? initialising ? "init" : (isPaused ? "stop": "run"):"inactive"}>
                <span>
                    {isProcessRuning ?( initialising ? "Initlialising" : (isPaused ? "Paused": "Running" )): "Inactive"}
                </span>
            </div>
        </div>
    )
}
export default BackendJob;