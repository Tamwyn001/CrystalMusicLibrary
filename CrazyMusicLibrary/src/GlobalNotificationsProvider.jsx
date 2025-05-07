import { IconCheck, IconInfoCircle, IconX } from "@tabler/icons-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const NotificationsContext = createContext();

const notifTypes = {
    SUCCESS : 'success',
    ERROR : 'error',
    INFO : 'info'
}

export const NotificationsProvider = ({ children }) => {
    const [notificationVisible, setNotificationVisible] = useState(null);
    const [currentNotification, setCurrentNotification] = useState(null); //{message, state} state = "success" | "error" | "info"
    const notificationDivRef = useRef(null);
    const timeoutRefs = useRef([]);

    const addNotification = (message, state) => {
        // Clear previous timeouts
        timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
        timeoutRefs.current = [];
        setCurrentNotification({ message, state });
        setNotificationVisible(true);
      
        const hideTimeout = setTimeout(() => {
          if (notificationDivRef.current) {
            notificationDivRef.current.setAttribute("direction", "");
            void notificationDivRef.current.offsetWidth;
            notificationDivRef.current.setAttribute("direction", "hide");
          }
      
          const cleanupTimeout = setTimeout(() => {
            setNotificationVisible(false);
            setCurrentNotification(null);
          }, 300);
      
          timeoutRefs.current.push(cleanupTimeout);
        }, 2000);
      
        timeoutRefs.current.push(hideTimeout);
    };
  
    useEffect(() => {
        if (!currentNotification) return;
        setNotificationVisible(true);
    }, [currentNotification]);
    
    useEffect(() => {
        if (!notificationVisible || !notificationDivRef.current) return;
        
        notificationDivRef.current.setAttribute("direction", "show");
    }, [notificationVisible]);
    

    const NotifIcon = () => {
        if(!notificationVisible) {return null}
        switch (currentNotification?.state) {
            case notifTypes.SUCCESS:
                return <IconCheck className="notification-icon" />
            case notifTypes.ERROR:
                return <IconX className="notification-icon" />
            case notifTypes.INFO:
                return <IconInfoCircle className="notification-icon" />
            default:
                return null
        }
    }

    return(
        <NotificationsContext.Provider 
        value={{notifTypes, addNotification}}
        >
            {children}
            {currentNotification ? 
            <div ref={notificationDivRef} className="notification-parent" id="notification-parent">
                <div className="notification" is-open={currentNotification ? "true" : "false"} >
                    <NotifIcon />
                    <span>{currentNotification.message}</span>
                </div>
            </div>:null
        }
        </NotificationsContext.Provider>
    )
}

//this is to import for the child components to call audio control functions
export const useNotifications = () => useContext(NotificationsContext);