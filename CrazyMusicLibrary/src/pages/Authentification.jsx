'use client'

import { useEffect, useState } from 'react'
import Register from '../components/Register.jsx';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login.jsx';
import Loading from '../components/Loading.jsx';
import apiBase from '../../APIbase.js';

const stauts = Object.freeze({
    LOGIN : "login",
    REGISTER : "register",
    ANY_USER : "any_user",
    VERIF_TOKEN : "verif_token"
});

const Authentification = () => {
    const navigate = useNavigate();
    const [areUsers, setAreUsers] = useState([]);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchUsers = async () => { 
            setResult(stauts.ANY_USER);
            const resUsers = await fetch(`${apiBase}/auth/any-user`, {method: 'GET'});
            const parsedUsers = await resUsers.json();
            setAreUsers(parsedUsers); 
            console.log(parsedUsers);
            if(parsedUsers === 0) {
                setIsLoading(false);
                setResult(stauts.REGISTER);
                return;
            }
            setResult(stauts.VERIF_TOKEN);
            const resToken = await fetch(`${apiBase}/auth/verifyToken`, {method: 'POST', credentials: 'include'}); 
            const parsedToken = await resToken.json();
            setIsLoading(false);
            if(parsedToken.success) {
                console.log("Token is valid");
                navigate('/home');
                return;
            }
            setResult(stauts.LOGIN);

        }
        fetchUsers();
    }, [navigate]);

    if(isLoading) {
       return <Loading text={result}/>;
    }

    if(result === stauts.LOGIN) {
        return <Login />;     
    }
    if(result === stauts.REGISTER) {
        navigate('/register');    
    }
   
    return null;
}
export default Authentification;