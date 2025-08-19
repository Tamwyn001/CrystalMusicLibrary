import { useNavigate  } from "react-router-dom"
import './Auth.css'

import apiBase from "../../APIbase.js";
import CML_logo from "./CML_logo.jsx";
import { useEffect, useState } from "react";
import CMLLogoAnimated from "./CMLLogoAnimated.jsx";
import ColorThemeButton from "./ColorThemeButton.jsx";
const Register = () => {
    const [welcomeMessage, setWelcomeMessage] = useState(true);
    const navigate = useNavigate();
    const handleRegister = async (e) => {
        e.preventDefault() // prevent form reload
        if (!e.target.email.value || !e.target.password.value || !e.target.repeat_password.value || !e.target.name.value) {
            alert('Please fill in all fields')
            return
        }
        if (e.target.password.value !== e.target.repeat_password.value) {
            alert('Passwords do not match')
            return
        }
        const formData = new FormData(e.target);    
        const res = await fetch(`${apiBase}/auth/register`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        })
    
        const json = await res.json()
    
        if (res.ok) {
            alert('User registered successfully')
            navigate('/home');
        } else {
            alert(json.error)
        }
    };
    useEffect(() => {
        fetch(`${apiBase}/auth/any-user`, {method: 'GET'})
        .then(res => res.json())
        .then(data => {setWelcomeMessage(data === 0);}) 
    }, [])

    const DisplayGotoLogin = () => {
        return <div style={{marginBottom : "30px",
             display:"flex", flexDirection:"row",
             alignItems:"center", margin:"auto", gap:"20px"}}>
                    <p style={{textWrap:"nowrap"}}>Already an account?</p>
                    <button style={{width : "100%"}} onClick={(e)=> {
                        e.stopPropagation();
                        navigate('/')}}>Login</button>
                </div>
    }

    return (
        <div className="authDiv">
        <ColorThemeButton useText={true} style={{position : "absolute", left: "10px"}}/>

        <CMLLogoAnimated/>
        <CML_logo />
        <h2>Register</h2>
        <p>{(welcomeMessage) ? 
            `Welcome to the Crystal Music Library! Since you are the first 
            to show up here, we would like you to create the admin account.`
            :'Please fill the form to register as a new user.'}</p>
         {(!welcomeMessage) && <DisplayGotoLogin/>}
        <form onSubmit={handleRegister}>
           
            <label htmlFor="email">Email</label>
            <input type="text" name="email" placeholder="Username" autoComplete="email"/>
            <label htmlFor="password">Password</label>
            <input type="password" placeholder="Password" name="password" autoComplete="new-password"/>
            <label htmlFor="repeat_password">Confirm Password</label>
            <input type="password" placeholder="Confirm Password" name="repeat_password" autoComplete="password"/>
            <label htmlFor="name">Name</label>
            <input type="text" name="name" placeholder="Name" autoComplete="name"/>
            <button type="submit">Register</button>
        </form>
        </div>
    );
}
export default Register;