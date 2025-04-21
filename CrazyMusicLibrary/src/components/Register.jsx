import { useNavigate  } from "react-router-dom"
import './Auth.css'
import logoURL from '../assets/CML_logo.svg'
import apiBase from "../../APIbase";
const Register = () => {
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
      }


    return (
        <div className="authDiv">
        <img src={logoURL} alt="CML logo"/>
        <h1>Register</h1>
        <p>Welcome to the Crazy_Music Library! Since you are the first to show up here, we would like you to create the admin account.</p>
        <form onSubmit={handleRegister}>
            <label htmlFor="email">Email</label>
            <input type="text" name="email" placeholder="Username" />
            <label htmlFor="password">Password</label>
            <input type="password" placeholder="Password" name="password"/>
            <label htmlFor="repeat_password">Confirm Password</label>
            <input type="password" placeholder="Confirm Password" name="repeat_password"/>
            <label htmlFor="name">Name</label>
            <input type="text" name="name" placeholder="Name" />
            <button type="submit">Register</button>
        </form>
        </div>
    );
}
export default Register;