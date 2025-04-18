'use client'

import { useEffect, useState } from 'react'
import Register from '../components/Register.jsx';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login.jsx';
import Loading from '../components/Loading.jsx';

const stauts = Object.freeze({
    LOGIN : "login",
    REGISTER : "register"
});

const Authentification = () => {
    const navigate = useNavigate();
    const [areUsers, setAreUsers] = useState([]);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchUsers = async () => { 
            const resUsers = await fetch('http://localhost:4590/auth/any-user', {method: 'GET'});
            const parsedUsers = await resUsers.json();
            setAreUsers(parsedUsers); 
            if(parsedUsers.length === 0) {
                setIsLoading(false);
                setResult(stauts.REGISTER);
                return;
            }
            const resToken = await fetch('http://localhost:4590/auth/verifyToken', {method: 'POST', credentials: 'include'}); 
            const parsedToken = await resToken.json();
            setIsLoading(false);
            if(parsedToken.success) {
                navigate('/home');
                console.log("Token is valid");
                return;
            }
            setResult(stauts.LOGIN);

        }
        fetchUsers();
    }, [navigate]);

    if(isLoading) {
        return <Loading />;
    }

    if(result === stauts.LOGIN) {
        return <Login />;     
    }
    return(<Register />)
}
export default Authentification;