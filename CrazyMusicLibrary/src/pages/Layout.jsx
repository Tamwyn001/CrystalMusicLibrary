import {Outlet, useLocation} from "react-router-dom";
import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";

import './Layout.css'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading.jsx";
import apiBase from "../../APIbase.js";
import { useAudioPlayer } from "../GlobalAudioProvider.jsx";

const Layout = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const {currentDisplayedPage} = useAudioPlayer();
    useEffect(() => {  
        const checkLogin = async () => {
            const resToken = await fetch(`${apiBase}/auth/verifyToken`, {method: 'POST', credentials: 'include'});
            const parsedToken = await resToken.json();
            if(parsedToken.success) {
                setLoading(false);
                return;
            }
           
            navigate('/');
        }
        checkLogin();
    }, [navigate]);
    
    if(loading) {
        return <Loading />;
    }
    const location = useLocation();
    const currentPath = location.pathname;
    const pageWithSidebarPhone = ['/home'];
    return (
        <div className="app-container">
            <Header />
            <div className="content-container" ref={currentDisplayedPage}
                page={pageWithSidebarPhone.includes(currentPath) ? currentPath: 'inside' }>
                <Sidebar />
                <div className="content">
                    <Outlet /> {/* Route content will render here */}
                </div>
            </div>
        </div>
    )
}

export default Layout
