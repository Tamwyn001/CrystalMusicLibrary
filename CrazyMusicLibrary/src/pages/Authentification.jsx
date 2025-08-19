'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login.jsx';
import apiBase from '../../APIbase.js';
import CMLLogoAnimated from '../components/CMLLogoAnimated.jsx';

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
    const BGImageRef = useRef(null);

    useEffect(() => {
        const fetchUsers = async () => { 
            setResult(stauts.ANY_USER);
            const resUsers = await fetch(`${apiBase}/auth/any-user`, {method: 'GET'});
            const parsedUsers = await resUsers.json();
            console.log('Parsed users', parsedUsers);
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
    if(result === stauts.REGISTER && !isLoading) {
        navigate('/register');    
    }
    return <>
        <CMLLogoAnimated/>
        {!isLoading && result === stauts.LOGIN  ? <Login /> :null}
    </>

}
export default Authentification;