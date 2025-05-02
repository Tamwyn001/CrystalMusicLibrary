import { createContext, use, useContext, useEffect, useRef, useState } from "react";
import { IconChevronRight, IconPlayerPlay, IconSearch } from "@tabler/icons-react";
import ActionBarEntry from "./components/ActionBarEntry";
import apiBase  from "../APIbase.js";
const GlobalActionBarContext = createContext();

const commandCodes = {
    SEARCH : 'search',
    OPEN_ACTION_BAR : 'open_action_bar',
    CLOSE_ACTION_BAR : 'close_action_bar',
}

const actions = [ //!! very important, keep order
    {
        name: 'search',
        code: commandCodes.SEARCH,
        description: 'Search for a song, an album, a genra, an artist',
        key: 'k',
        modifier: 'ctrl',
        keywords: ["search", "find", "look for", "seek", "search for", "find for", "look for for", "seek for"],
        icon: () => {return <IconSearch className="action-bar-current-logo" />}
    },
    {
        name: 'open action bar',
        code: commandCodes.OPEN_ACTION_BAR,
        description: 'Give a command',
        key:" ", //spacebar
        modifier: 'ctrl',
        keywords: []
    },
    {
        name: 'open action bar',
        code: commandCodes.CLOSE_ACTION_BAR,
        description: '',
        key:"Escape", //spacebar
        modifier: '',
        keywords: []
    }
]

const GlobalActionBar = ({children}) => {
    const boundEvents = useRef([]); //{callback, code}
    const [showActionBar, setShowActionBar] = useState(false);
    const [actionBarCommand, setActionBarCommand] = useState(null);
    const [showingActionLogo, setShowingActionLogo] = useState(false);
    const [currentCommand, setCurrentCommand] = useState(null); //elem of actions
    const [proposedCommands  , setProposedCommands] = useState([]); //elem of actions
    const keyCallbackBinder = (e) => {
        if(e.key == "Control") {return}
        const actionToCall = actions.find((action) => { return (
             ((e.key === action.key) && (
                    (!action.modifier || action.modifier == '') ? true : ((action.modifier === 'ctrl' ? e.ctrlKey : true) 
                                      || (action.modifier === 'shift' ? e.shiftKey : true)
                                      || (action.modifier === 'alt' ? e.altKey : true)
                                      || (action.modifier === 'meta' ? e.metaKey : true)))))}
        );   
        if(!actionToCall) {return}
    
        setCurrentCommand(actionToCall);
        boundEvents.current.forEach((event) => {
            if (event.code === actionToCall.code) {
                event.callback(e);
                console.log("Event triggered", event.code, actionToCall.code);
                e.preventDefault();
            }
        });
        
    }

    const registerNewEvent = (callback, code) => {
        const event = {
            callback: callback,
            code: code
        }
        boundEvents.current.push(event);
    }
    const registerDefaultEvents = () => {
        registerNewEvent(() => {setShowActionBar(true); setActionBarCommand(null)}, commandCodes.OPEN_ACTION_BAR);
        registerNewEvent(() => {setShowActionBar(false); setActionBarCommand(null)}, commandCodes.CLOSE_ACTION_BAR);
        registerNewEvent(() => {setShowActionBar(true); setActionBarCommand(commandCodes.SEARCH);}, commandCodes.SEARCH);
    }

    useEffect(() => {
        if (showActionBar) {
            document.getElementById("actionbar-searchbar").focus();
        }
    },[showActionBar]);
    useEffect(() => {console.log(actionBarCommand)},[actionBarCommand]);
    useEffect(() => {
        window.addEventListener("keydown", keyCallbackBinder)
        registerDefaultEvents();
        return () => {
            window.removeEventListener("keydown", keyCallbackBinder)
            // boundEvents.forEach((event) => {
            //     window.removeEventListener(event.type, event.callback)
            // }
        }
    }, []);

    const CurrentCommandPrefix = () => {
        if (actionBarCommand === commandCodes.SEARCH) {
            setShowingActionLogo(true);

            return(<div className="action-bar-logo-container"><IconSearch className="action-bar-current-logo" /> </div>)
        }
        setShowingActionLogo(false);
        return null;
    }

    const findMatchingCommands = (e) => {
        const input = e.target.value;
        if (input=== "") {
            setProposedCommands([]);
            return;
        }
        if(actionBarCommand === commandCodes.SEARCH){
            fetchSearchResults(input);
        }
        const possibleActions = actions.filter((action) => {
            return (action.keywords?.length > 0 && action.keywords.some((keyword) => keyword.includes(input)))
        });

        setProposedCommands(possibleActions);

    }

    const getTooltipOnSearchResult = (type) => {
        switch (type) {
            case 'track':
                return <IconPlayerPlay className="action-bar-entry-tooltip-logo" />;
            case 'album':
                return <div className="action-tooltip-div"> <span style={{margin: "0"}}>View album</span> <IconChevronRight className="action-bar-entry-tooltip-logo"/></div>;
            case 'artist':
                return <div className="action-tooltip-div"> <span style={{margin: "0"}}>View artist</span> <IconChevronRight className="action-bar-entry-tooltip-logo"/></div>;
            default:
                return null
            }
    };

    const fetchSearchResults = async (input) => {
        if (input === "") {return;}
        console.log(`${apiBase}/read-write/search/${input}`);
        fetch(`${apiBase}/read-write/search/${input}`, {
            method: "GET"})
        .then((res) => {
            if (res.ok) {
                return res.json();
            }
            throw new Error("Error fetching search results");
        })
        .then((data) => {
            const remappedTrack = [...data.tracks.map(track => {return({type : "track", ...track})}),
                                   ...data.albums.map(track => {return({type : "album", ...track})}),
                                   ...data.artists.map(track => {return({type : "artist", ...track})})]
                .map((item) => {
                    return {icon : () => {return <img className="action-bar-entry-logo" 
                            src={`${apiBase}/${item.type === 'artist' ? "artist" : "covers"}/${item.path?.split('//').pop()}`} 
                             alt={item.name} />},
                             tooltip : getTooltipOnSearchResult,
                            ...item }});
            setProposedCommands(remappedTrack);
        })
    }

    const handleActionBarEntryClick = (code) => {
        switch (code) {
            case commandCodes.SEARCH:
                setShowActionBar(true);
                setActionBarCommand(commandCodes.SEARCH);
                setCurrentCommand(actions[0]);
                document.getElementById("actionbar-searchbar").value = "";
                document.getElementById("actionbar-searchbar").focus();
                setProposedCommands([]);
                break;
            case commandCodes.CLOSE_ACTION_BAR:
                setShowActionBar(false);
                setActionBarCommand(null);
                break;
            default:
                break;
        }
    }
    return (
        <GlobalActionBarContext.Provider
            value={{commandCodes}}>
            <div className="action-bar-app-parent">
                {(showActionBar) && <div className="global-action-bar">
                    <div className="action-bar">
                        <div className="action-bar-research">
                            
                            <CurrentCommandPrefix />
                        
                            <input logo={`${showingActionLogo}`} type="text" id="actionbar-searchbar" onChange={findMatchingCommands} placeholder={`${currentCommand.description}`} />

                        </div>

                        <div className="action-bar-results">
                                {proposedCommands.map((action) => <ActionBarEntry key={action.code} entry={action} onClick={handleActionBarEntryClick}/>)}

                        </div>
                        
                    </div>
                </div>}
                {children}
            </div>
        </GlobalActionBarContext.Provider>
    )
}

export default GlobalActionBar;
export const useGlobalActionBar = () => {useContext(GlobalActionBarContext)}