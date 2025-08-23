import { createContext, useContext, useRef } from "react";

const EventContext = createContext();
export const useEventContext = () => useContext(EventContext);
export const EventProvider = ({ children }) => {

    const listenersRef = useRef(new Map());

    
    const subscribe = (eventName, callback) => {
        //init an array for a new event
        if (!listenersRef.current.has(eventName)) listenersRef.current.set(eventName, new Set());
        listenersRef.current.get(eventName).add(callback);
        // console.log('registered', eventName, callback, listenersRef.current);
        //returns an unsubscribing function 
        return () => {
            listenersRef.current.get(eventName)?.delete(callback);

          };
    };

    //calls all bound event to the eventName
    const emit = (eventName, payload) => {
        if (listenersRef.current.has(eventName)){
            listenersRef.current.get(eventName).forEach(cb => {cb(payload); console.log('called at', cb)});  
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