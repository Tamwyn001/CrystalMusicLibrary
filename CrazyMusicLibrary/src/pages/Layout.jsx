import {Outlet} from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

import './Layout.css'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";


const Layout = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkLogin = async () => {
            const resToken = await fetch('http://localhost:4590/auth/verifyToken', {method: 'POST', credentials: 'include'});
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
    return (
        <div className="app-container">
            <Header />
            <div className="content-container">
                <Sidebar />
                <div className="content">
                    <Outlet /> {/* Route content will render here */}
                </div>
            </div>
        </div>
    )
}

export default Layout
