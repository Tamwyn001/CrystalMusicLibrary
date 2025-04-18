import { useNavigate  } from "react-router-dom"
import logoURL from '../assets/CML_logo.svg'   
import './auth.css'

const Register = () => {
    const navigate = useNavigate();
    const handleLogin = async (e) => {
        e.preventDefault() // prevent form reload
        if (!e.target.email.value || !e.target.password.value) {
            alert('Please fill in all fields')
            return
        }
        const formData = new FormData(e.target);    
        const res = await fetch('http://localhost:4590/auth/login', {
            method: 'POST',
            credentials: 'include',
            body: formData
        })
    
        const json = await res.json()
    
        if (res.ok) {
        alert('User login successfully')
        navigate('/home');
        } else {
        alert(json.error)
        }
      }


    return (
        <div className="authDiv">
        <img src={logoURL} alt="CML logo"/>
        <h1>Login</h1>
        <p>We were not able to connect you, please login.</p>
        <form onSubmit={handleLogin}>
            <label htmlFor="email">Email</label>
            <input type="text" name="email" placeholder="Username" />
            <label htmlFor="password">Password</label>
            <input type="password" placeholder="Password" name="password"/>
            <button type="submit">Login </button>
        </form>
        </div>
    );
}
export default Register;