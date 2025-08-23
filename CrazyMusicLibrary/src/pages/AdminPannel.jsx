import { useEffect, useRef, useState } from "react";
import apiBase from "../../APIbase.js";
import Header from "../components/Header.jsx";
import { IconArrowBackUp ,IconDatabaseHeart,IconMacro, IconPrismLight, IconSettingsCode } from "@tabler/icons-react";
import UserAccountInfosEntry from "../components/UserAccountInfosEntry.jsx";
import { useNavigate } from "react-router-dom";
import './AdminPannel.css';
import BackendJob from "../components/BackendJob.jsx";
import AdminSettingEntry from "./AdminSettingEntry.jsx";
import TwoOptionSwitch from "../components/TwoOptionSwitch.jsx";
import { asVerified } from "../../lib.js";


const AdminPannel = () => {
    const getJobViewValue = () => {
        return localStorage.getItem("job-progress-view") ?
                localStorage.getItem("job-progress-view") === "true" :
                true
    }
    const [isAdmin, setIsAdmin] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [totalStorage, setTotalStorage] = useState(0);
    const doneTotalView = useRef(getJobViewValue());
    const navigate = useNavigate();

    useEffect(()=>{
        const verify = asVerified(() => {
            fetch(`${apiBase}/auth/is-admin`, {
                method: 'POST',
                credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {setIsAdmin(data);})
        });
        verify();
    },[]);
    useEffect(() => {
        if(isAdmin.error) return;
        fetch(`${apiBase}/auth/init-admin-pannel`, {
            method: 'POST',
            credentials: 'include'
        }).then(res => res.json())
        .then(data => {
            setAllUsers(data.users);
            setTotalStorage(data.totalStorage);
        })
    },[isAdmin]);

    const NotAuthorized = () => {
        return (
            <div>
                <h1>Access Denied</h1>
                <p>You are not an admin.</p>
            </div>
        );
    }
    const changeView = (index) => {
        const useDoneTotal = index === 0;
        doneTotalView.current = useDoneTotal;
        localStorage.setItem("job-progress-view", useDoneTotal)
    }
    const AdminPannel = () => {
        return (
            <div>
                <h1>Admin pannel</h1>
                <p>Only for the true admins.</p>
                <div className="admin-category">
                    <IconDatabaseHeart/>
                    <h2 >Users' storage usage</h2>    
                </div>
                <div className="all-users-list">
                    {allUsers.map((user) => (<UserAccountInfosEntry key={user.id} user={user} totalStorage={totalStorage}/>))}
                </div>
                <div  className="admin-category">
                    <IconMacro/>
                    <h2 >Backend processes</h2>  
                    <TwoOptionSwitch data={["Done/Total","Working/Remaining"]}
                        currentActive={getJobViewValue() ? 0 : 1}
                        onClick={changeView}
                    />
                </div>
                <div className="job-grid" >
                    <BackendJob jobKey={"JOB_CD"} jobName={"Recompute tracks number and CDs"}
                        description={"Reextract the metadatas of the songs to remap them to the correct CD or track number. Analyses lossless."}
                        doneTotalView={doneTotalView}/>
                     <BackendJob jobKey={"JOB_FFT"} jobName={"Compute audio spectras"}
                        description={"Runs a fast Fourier transform on each audio files to extract the audio spectrum. The result is writen into .bin files. For a .flac audio of 41kHz, we expect 3Mb spectrum file."}
                        payload={{completeLibrary : true}}
                        doneTotalView={doneTotalView}/>

                    {/* <BackendJob jobKey={"JOB_LOSSLES"} jobName={"Analyse Lossless"}
                        description={"Reextract the metadatas of the songs to check for lossy or not songs."}/>
                    <BackendJob jobKey={"JOB_LYRICS"} jobName={"Analyse Lyrics"}
                        description={"Runs a voice recognition model to extract dynamic lyrics from the songs."}/> */}
                </div>
                <div className="admin-category">
                    <IconSettingsCode/>
                    <h2>Configuration</h2>    
                </div>
                <div className="admin-settings-list">
                    <AdminSettingEntry 
                        linkedSettingKey={"FFT"}
                        entryName={"Audio spectra"} 
                        entryIcon={<IconPrismLight/>}/> 
                </div>
            </div>
        );
    }
    
    return (
        <div className="account-page">
            < Header/>
            <div className="account-content">
                <button className="roundButton go-back" onClick={() => navigate('/home')}>
                    <IconArrowBackUp />
                </button>
                <div className="account-info">
                    {isAdmin ? <AdminPannel /> : <NotAuthorized />}
                </div>
            </div>
        </div>
    );
}

export default AdminPannel;