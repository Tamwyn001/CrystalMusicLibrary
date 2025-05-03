import { createContext, use, useContext, useEffect, useRef, useState, memo } from "react";
import { IconArrowsShuffle, IconCheck, IconChevronRight, IconInfoCircle, IconPlayerPlay, IconSearch, IconX } from "@tabler/icons-react";
import ActionBarEntry from "./components/ActionBarEntry";
import apiBase  from "../APIbase.js";
import { useAudioPlayer } from "./GlobalAudioProvider.jsx";
const GlobalActionBarContext = createContext();
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
const commandCodes = {
    SEARCH : 'search',
    OPEN_ACTION_BAR : 'open_action_bar',
    CLOSE_ACTION_BAR : 'close_action_bar',
    PLAY_SONG : 'play_song',
    OPEN_ALBUM : 'open_album',
    OPEN_ARTIST : 'open_artist',
    PLAY_LIBRARY_RANDOM : 'play_library_random',
    TOGGLE_PLAY_PAUSE : 'toggle_play_pause',
}
const notifTypes = {
    SUCCESS : 'success',
    ERROR : 'error',
    INFO : 'info'
}
const actions = [ //!! very important, keep order
    {
        name: 'Search',
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
        name: 'Play the library in shuffle',
        code: commandCodes.PLAY_LIBRARY_RANDOM,
        description: '',
        key:"r", //spacebar
        modifier: 'ctrl',
        keywords: ["play", "shuffle", "random", "library", "all", "all songs", "all albums", "all artists"],
        icon: () => {return <IconArrowsShuffle className="action-bar-current-logo" />} 
    },
    {
        name: 'Toggle Play pause',
        code: commandCodes.TOGGLE_PLAY_PAUSE,
        description: '',
        key:" ", //spacebar
        modifier: '',
        keywords: ["pause", "play", "toggle", "play/pause", "play pause"],
        icon: () => {return <IconArrowsShuffle className="action-bar-current-logo" />} 
    },
];

const GlobalActionBar = ({children}) => {
    const boundEvents = useRef([]); //{callback, code}
    const [showActionBar, setShowActionBar] = useState(false);
    const showActionBarRef = useRef(showActionBar); // to avoid infinite loop
    const [actionBarCommand, setActionBarCommand] = useState(null);
    const [showingActionLogo, setShowingActionLogo] = useState(false);
    const [currentCommand, setCurrentCommand] = useState(null); //elem of actions
    const [proposedCommands  , setProposedCommands] = useState([]); //elem of actions
    const [currentActionLogo, setCurrentActionLogo] = useState(null); //elem of actions
    const {playTrackNoQueue, playLibraryShuffle, toggleTrackPaused} = useAudioPlayer();
    const navigate = useNavigate();
    const [currentNotification, setCurrentNotification] = useState(null); //{message, state} state = "success" | "error" | "info"

    const addNotification = (message, state) => {
        setCurrentNotification({message, state});
        setTimeout(() => {
            const elem =  document.getElementById("notification-parent");
            elem.setAttribute("direction","");
            void elem.offsetWidth; // <== forces reflow
            elem.setAttribute("direction", "hide");

            setTimeout(() => {
                setCurrentNotification(null);
            }, 300);
        }, 2000);
    }

    useEffect(() => {
        if(!currentNotification) {return}
        document.getElementById("notification-parent").setAttribute("direction","show");
    },[currentNotification]);
    const keyCallbackBinder = (e) => {
        if(e.key =="Escape" && showActionBarRef.current) {closeActionBar(); return}
        if(e.key == "Control" || currentCommand) {return}
        const actionToCall = actions.find( (action) => {
            const keyMatch = e.key === action.key;
          
            if (!keyMatch) return false;
            if (!action.modifier || action.modifier === "") return true;
          
            const modifiers = {
              ctrl: e.ctrlKey,
              shift: e.shiftKey,
              alt: e.altKey,
              meta: e.metaKey,
            };
          
            return modifiers[action.modifier];}
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
    const toggleTrackPauseRef = useRef(toggleTrackPaused);
    toggleTrackPauseRef.current = toggleTrackPaused; 

    const registerDefaultEvents = () => {
        registerNewEvent(() => {setShowActionBar(true); setActionBarCommand(null)}, commandCodes.OPEN_ACTION_BAR);
        registerNewEvent(() => {setShowActionBar(false); setActionBarCommand(null)}, commandCodes.CLOSE_ACTION_BAR);
        registerNewEvent(() => {setShowActionBar(true); setActionBarCommand(commandCodes.SEARCH);}, commandCodes.SEARCH);
        registerNewEvent(() => {toggleTrackPauseRef.current()}, commandCodes.TOGGLE_PLAY_PAUSE); //wee need the ref, otherwise it memorizes the value of the function at load: false
    }

    useEffect(() => {
        if (showActionBar) {
            document.getElementById("actionbar-searchbar").focus();
        }
        showActionBarRef.current = showActionBar;
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
    useEffect(() => {
        switch (actionBarCommand) {
        case commandCodes.SEARCH:
          setShowingActionLogo(true);
          setCurrentActionLogo(() => <div className="action-bar-logo-container"><IconSearch className="action-bar-current-logo" /> </div>);
          break;
        default:
            setShowingActionLogo(true);
            setCurrentActionLogo(null)
        }
      }, [actionBarCommand]);


    const findMatchingCommands = (e) => {
        const input = e.target.value;
        if (input=== "") {
            setProposedCommands([]);
            return;
        }
        if(actionBarCommand === commandCodes.SEARCH){
            fetchSearchResults(input);
            return;
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
                .map((item) => { const fileName = item.path?.split('\\').pop();
                    const trackName = item.trackPath?.split('\\').pop();
                    const {trackPath, ...itemSorted} = item;
                    return {icon : () => {return <img className="action-bar-entry-logo" 
                            src={`${apiBase}/${item.type === 'artist' ? "artist" : "covers"}/${fileName}`} 
                             alt={item.name} />},
                             tooltip : getTooltipOnSearchResult,
                             code : item.type === 'artist' ? commandCodes.OPEN_ARTIST :
                                    item.type === 'album' ? commandCodes.OPEN_ALBUM :
                                    commandCodes.PLAY_SONG,
                             fileName : fileName,
                             trackName : trackName,
                             ...itemSorted}});
            setProposedCommands(remappedTrack);
        })
    }

    const handleActionBarEntryClick = (item) => {
        switch (item.code) {
            case commandCodes.SEARCH:
                setShowActionBar(true);
                setActionBarCommand(commandCodes.SEARCH);
                setCurrentCommand(actions[0]);
                document.getElementById("actionbar-searchbar").value = "";
                document.getElementById("actionbar-searchbar").focus();
                setProposedCommands([]);
                break;
            case commandCodes.CLOSE_ACTION_BAR:
                closeActionBar();
                break;
            case commandCodes.PLAY_SONG:
                console.log("Playing song", item);
                playTrackNoQueue(item.trackName);
                closeActionBar();
                break;
            case commandCodes.OPEN_ALBUM:
                closeActionBar();
                navigate(`/albums/${item.id}`);
                break;
            case commandCodes.OPEN_ARTIST:
                closeActionBar();
                navigate(`/artists/${item.id}`);
                break;
            case commandCodes.PLAY_LIBRARY_RANDOM:
                addNotification("Playing the library in shuffle", notifTypes.INFO);
                playLibraryShuffle();
                closeActionBar();
                break;
            default:
                break;
        }
    }
    const closeActionBar = () => {
        setShowActionBar(false);
        setActionBarCommand(null);
        setProposedCommands([]);
    }
    const openSearchBar = () => {
        setShowActionBar(true);
        setActionBarCommand(commandCodes.SEARCH);
        setCurrentCommand(actions[0]);
        document.getElementById("actionbar-searchbar").value = "";
        document.getElementById("actionbar-searchbar").focus();
        setProposedCommands([]);
    }
    const Notification = () => {
        if(!currentNotification) {return null}
        const NotifIcon = () => {
            switch (currentNotification.state) {
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
        <div className="notification-parent" id="notification-parent">
            <div className="notification" is-open={currentNotification ? "true" : "false"} >
                <NotifIcon />
                <span>{currentNotification.message}</span>
            </div>
        </div>)
    }
    return (
        <GlobalActionBarContext.Provider
            value={{commandCodes,
             openSearchBar,
             notifTypes,
             addNotification}}>
            <div className="action-bar-app-parent">
                
                {children}
                <Notification/>
                {(showActionBar) && <div className="global-action-bar">
                    <div className="action-bar">
                        <div className="action-bar-research">
                            
                            {(currentActionLogo)? currentActionLogo : null}
                        
                            <input  type="text" id="actionbar-searchbar" onChange={findMatchingCommands} placeholder={`${currentCommand.description}`} />

                        </div>

                        <div className="action-bar-results">
                                {proposedCommands.map((action) => <ActionBarEntry key={uuidv4()} entry={action} onClick={handleActionBarEntryClick}/>)}
                        </div>
                        
                    </div>
                </div>}
            </div>
        </GlobalActionBarContext.Provider>
    )
}

export default GlobalActionBar;
export const useGlobalActionBar = () => {useContext(GlobalActionBarContext)}