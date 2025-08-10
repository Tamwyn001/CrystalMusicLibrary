import { createContext, useContext, useRef } from "react";

const EventContext = createContext();
export const useEventContext = () => useContext(EventContext);
export const EventProvider = ({ children }) => {

    const listenersRef = useRef({});

    
    const subscribe = (eventName, callback) => {
        //init an array for a new event
        if (!listenersRef.current[eventName]) listenersRef.current[eventName] = [];
        listenersRef.current[eventName].push(callback);
        console.log('registered', eventName, callback);
        //returns an unsubscribing function 
        return () => {
            listenersRef.current[eventName] = listenersRef.current[eventName].filter(cb => cb != callback);
        };
    };

    //calls all bound event to the eventName
    const emit = (eventName, payload) => {
        if (listenersRef.current[eventName]){
            listenersRef.current[eventName].forEach(cb => {cb(payload); console.log('called at', cb)});  
            };
        };

    return (
    <EventContext.Provider value={{
        emit,
        subscribe}}>
        {children}
    </EventContext.Provider>
    )
}