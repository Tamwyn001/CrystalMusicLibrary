import { useNavigate  } from "react-router-dom"   
import './Auth.css'
import apiBase from "../../APIbase";
import CML_logo from "./CML_logo";
import ThreePointsLoader from "./ThreePointsLoader";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useEventContext } from "../GlobalEventProvider";
const LoginStatus = {
    FETCHING : "fetching",
    SUCCESS : "success",
    REJECTED : "rejected",
    NONE: "none"
};
const Register = () => {
    const status = useRef(LoginStatus.NONE);
    const [displayedStatus, setDisplayedStatus] = useState(LoginStatus.NONE);
    const navigate = useNavigate();
    const {emit} = useEventContext();
    const handleLogin = async (e) => {
        e.preventDefault() // prevent form reload
        if (!e.target.email.value || !e.target.password.value) {
            alert('Please fill in all fields')
            return
        }
        const formData = new FormData(e.target);    
        const res = await fetch(`${apiBase}/auth/login`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
    
        const json = await res.json()

        if (res.ok) {
            localStorage.setItem('username', json.username)
            status.current = LoginStatus.SUCCESS;
        } else {
            status.current = LoginStatus.REJECTED;
        }
        redisplayStatus();
      }
      const RequestStatus = () => {
        switch (displayedStatus) {
            case LoginStatus.FETCHING:
                return <ThreePointsLoader/>
            case LoginStatus.SUCCESS:
                return (<div className="loginFeedback" sucess="true"><IconCheck className="successIcon" /><span>Logged in</span></div>)
            case LoginStatus.REJECTED:
                return (<div className="loginFeedback" sucess="false"><IconX className="failIcon" /><span>Wrong credentials</span></div>)
            default:
                return null
        }
      }
    
    const redisplayStatus = () => {
        setDisplayedStatus(status.current);
        switch (status.current) {
            case LoginStatus.REJECTED:
                setTimeout(() => {
                    setDisplayedStatus(LoginStatus.NONE)
                }, 1000);
                break;
            case LoginStatus.SUCCESS:
                setTimeout(() => {
                    emit("login");
                    navigate('/home')
                }, 1000)
                break;
        }
    }

    return (
        <div className="authDiv">
        <CML_logo />
        <h1>Login</h1>
        <p>We were not able to connect you, please login.</p>
        <form onSubmit={handleLogin}>
            <label htmlFor="email">Email</label>
            <input type="text" name="email" placeholder="Username" autoComplete="email"/>
            <label htmlFor="password">Password</label>
            <input type="password" placeholder="Password" name="password" autoComplete="password"/>
            <button type="submit">Login </button>
            <p>Don't have an account?</p>
            <button onClick={()=> {navigate('/register')}}>Register</button>
        </form>
        <RequestStatus/>
        </div>
    );
}
export default Register;