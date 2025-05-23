import { useNavigate  } from "react-router-dom"
import './Auth.css'

import apiBase from "../../APIbase";
import CML_logo from "./CML_logo";
import { useEffect, useState } from "react";
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
        return <div><p>Already an account?</p><button onClick={()=> {navigate('/')}}>Login</button></div>
    }

    return (
        <div className="authDiv">
        <CML_logo />
        <h1>Register</h1>
        <p>{(welcomeMessage) ? 
            `Welcome to the crystal_Music Library! Since you are the first 
            to show up here, we would like you to create the admin account.`
            :'Please fill the form to register as a new user.'}</p>
        {(!welcomeMessage) && <DisplayGotoLogin/>}
        <form onSubmit={handleRegister}>
            <label htmlFor="email">Email</label>
            <input type="text" name="email" placeholder="Username" autocomplete="email"/>
            <label htmlFor="password">Password</label>
            <input type="password" placeholder="Password" name="password" autocomplete="new-password"/>
            <label htmlFor="repeat_password">Confirm Password</label>
            <input type="password" placeholder="Confirm Password" name="repeat_password" autocomplete="password"/>
            <label htmlFor="name">Name</label>
            <input type="text" name="name" placeholder="Name" autocomplete="name"/>
            <button type="submit">Register</button>
        </form>
        </div>
    );
}
export default Register;