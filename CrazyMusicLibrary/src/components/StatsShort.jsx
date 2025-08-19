import { useEffect, useState } from "react";
import { parseDataSize} from "../../lib.js";
import apiBase from "../../APIbase.js";
import ProgressBar from "./ProgressBar.jsx";
const StatShort = () => {
    const [stats, setStats] = useState(null);
    const [serverStats, setServerStats] = useState(null);
    const [serverUsage, setServerUsage] = useState(null);
    const [isResponding, setIsResponding] = useState(null);

    useEffect(() => {
        const interval = setInterval(checkServerStatus, 5000); // Check every 5 seconds
        checkServerStatus(); // Initial check
        return () => clearInterval(interval); // Cleanup on unmount
    }, []);
    const checkServerStatus = () => {
            try {
                fetch(`${apiBase}/isResponding`)
                    .then(response => {
                        if (response.status === 200) {
                            if(isResponding === false){checkServerStatsRoutine();}
                            setIsResponding(true);
                        } else {
                            setIsResponding(false);
                        }
                    })
                    .catch(error => {
                        console.error('Fetch failed (e.g., CORS error):', error);
                        setIsResponding(false);
                    });
            } catch (error) {
                console.error('Unexpected error:', error); // Just in case something else goes wrong
                setIsResponding(false);
            }
        };

    const checkServerStatsRoutine = () => {
        fetch(`${apiBase}/read-write/stats`, {
            method: 'GET'})
            .then(response => response.json())
            .then(data => {setStats(data);})
            .catch(error => console.error('Error fetching stats:', error));
        fetch(`${apiBase}/read-write/serverStats`, {
            method: 'GET'})
            .then(response => response.json())
            .then(data => {
                setServerStats(parseDataSize(data.coversByteUsage + data.tracksByteUsage).readable);
                setServerUsage({perent : (1 - (data.free / data.size)) * 100, 
                    total: parseDataSize(data.size).readable, 
                    free: parseDataSize(data.free).readable});})
            .catch(error => console.error('Error fetching server stats:', error));
    }
    useEffect(() => {
        checkServerStatsRoutine();
    }, []);

    return(
        <div className="stat-short">
            {/* <h4>Statistics</h4>
            <p>Total Songs: {stats?.totalTracks}</p>
            <p>Music duration {parseAudioDuration(stats?.totalDuration).readable}</p> */}
            <div className="stat-short-category">
                <p>Library size: {serverStats}</p>
                <p>Free {serverUsage?.free} of {serverUsage?.total}</p>
                <ProgressBar percent={serverUsage?.perent} total={serverUsage?.total}
                style={{height : '10px'}} fillColor={'var(--chill-purple)'} initialising={!(serverStats)} />
            </div>
            <div style={{display : 'flex', alignItems : 'baseline', gap : '5px'}}>
                <div className="server-status-sprite" style={
                    {width : '10px', height : '10px', borderRadius : '10px', backgroundColor : (isResponding) ? 'lightgreen': 'red'}}/>
                <p>Server is {isResponding ? "online" : "offline"}</p>
            </div>
        </div>
    )
}

export default StatShort;