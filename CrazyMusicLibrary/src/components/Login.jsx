import { useNavigate  } from "react-router-dom"   
import './auth.css'
import apiBase from "../../APIbase";
import CML_logo from "./CML_logo";
import ThreePointsLoader from "./ThreePointsLoader";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
const LoginStatus = {
    FETCHING : "fetching",
    SUCCESS : "success",
    REJECTED : "rejected",
    NONE: "none"
};
const Register = () => {
    const [status, setStatus] = useState(LoginStatus.NONE);
    const [displayedStatus, setDisplayedStatus] = useState(LoginStatus.NONE);
    const navigate = useNavigate();
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
        })
    
        const json = await res.json()
    
        if (res.ok) {
            localStorage.setItem('username', json.username)
            setStatus(LoginStatus.SUCCESS)
        } else {
            setStatus(LoginStatus.REJECTED)
        }
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
    
    useEffect(() => {
        setDisplayedStatus(status)
        switch (status) {
            case LoginStatus.REJECTED:
                setTimeout(() => {
                    setDisplayedStatus(LoginStatus.NONE)
                }, 1000)
            case LoginStatus.SUCCESS:
                setTimeout(() => {
                    navigate('/home')
                }, 1000)
                break
            default:
                break
        }
    }, [status])

    return (
        <div className="authDiv">
        <CML_logo />
        <h1>Login</h1>
        <p>We were not able to connect you, please login.</p>
        <form onSubmit={handleLogin}>
            <label htmlFor="email">Email</label>
            <input type="text" name="email" placeholder="Username" />
            <label htmlFor="password">Password</label>
            <input type="password" placeholder="Password" name="password"/>
            <button type="submit">Login </button>
        </form>
        <RequestStatus/>
        </div>
    );
}
export default Register;