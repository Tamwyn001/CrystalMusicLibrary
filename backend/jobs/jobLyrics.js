const { getDatabase } = require("../db");
const {Job, JobStatus} = require("./jobBase");
const JobsManager = require('./jobs');
const { JobContainerSearchMode, LIBRARY_AGENT } = require("../statics");
const pLimit = require("p-limit");

const librProvider = 'https://lrclib.net/api'
const findEntryAPiGet = (entry) =>`${librProvider}/get?${new URLSearchParams(entry).toString()}`;
const findEntryAPiSearch = (entry) =>`${librProvider}/search?${new URLSearchParams(entry).toString()}`;
const API_SEARCH_METHODE = {
    GET : "get",
    SEARCH : "search",
    GET_CACHED : "get_cached"
}

function stripFeaturing(title) {
  return title
    .replace(/\s*\((feat\.|ft\.|featuring)\s+[^)]+\)/gi, '')
    .trim();
}
class JobLyrics extends Job{

   
    /** @type  {import("p-limit").LimitFunction}*/
    jobQueueLimit = null;

     /** @type  {string[]} The new tracks added in the meanwhile.*/
    newPendingJobs = [];
    currentConfig = {};
    /**
     * @param {{mode : string, tracks : string[]}} payload Do we have to recompute the whole library
     * @param {string} jobKey
     * @param {JobsManager} jobManager
    */
    constructor(jobKey, jobManager, payload)  {

        // @ts-ignore
        super( jobKey, jobManager, payload);
        this.init( jobKey, jobManager, payload)

    };
    init = async (jobKey, jobManager, payload) =>{
        this.currentConfig = require(jobManager.libraryConfig.configFilePath);

        this.jobQueueLimit = pLimit(this.currentConfig.ServerLyrics.concurrency);
        let query;
        switch (payload.mode) {
            case JobContainerSearchMode.ALL:
                query = this.getWholeLibraryTracksSignature();
                break;
            case JobContainerSearchMode.ALBUM:
                query = this.getAlbumSignatures(payload.target);
                break
            case JobContainerSearchMode.TRACK:
                query = this.getTrackSignature(payload.target);
            }

            await this.startJobFromQuery(query);

                
        this.jobManager.stopJob(this.jobKey);
        
    }

    async startJobFromQuery(query){
        console.log("Started", query);
        this.updateProgress(0,query.length);
            const progressInterval = setInterval(() => {
                console.log(`Running: ${this.jobQueueLimit.activeCount}, pending: ${this.jobQueueLimit.pendingCount}`);
                const done =  this.progress.total
                        -this.jobQueueLimit.activeCount
                        -this.jobQueueLimit.pendingCount;
                if (this.progress.done != done ||
                    this.progress.total != this.jobQueueLimit.pendingCount){
                    this.updateProgress(done, this.progress.total);
                    this.progress.working = this.jobQueueLimit.activeCount;
                }
            }, 250);
            console.log("Recursive start")
            await this.recursiveApiCall(query);
            clearInterval(progressInterval);
            this.updateProgress(this.progress.total,this.progress.total);
    }

    async recursiveApiCall(query){
        //recursive stop
        if(query.length === 0) return;
        let pending = [...this.newPendingJobs];
        console.log("New pending", pending.length)
        this.newPendingJobs = [];
        // Runs until all api call are done
        let todo = [...query, ...pending];
        if (todo.length === 0) return;

        const jobs = [];
        for (query in todo){
            jobs.push(this.jobQueueLimit( () => 
                 this.fetchAddLyricsPromise(query, API_SEARCH_METHODE.GET).then(() => {
                    if(this.status!=JobStatus.RUNNING) this.resumeJob()})).catch(
                        (err)=>{console.log("Could not fetch lyrics")}))
        }
        await Promise.all(jobs);
        console.log("Treated", todo.length,"    in this recurssion.")
        await this.recursiveApiCall(this.newPendingJobs);
    }
    static fetchLyrics = (search, method) => {return new Promise(async (res, rej) => {
        const apiCall = method === API_SEARCH_METHODE.GET ?  findEntryAPiGet(search) 
                    : (API_SEARCH_METHODE.SEARCH ?  findEntryAPiSearch(search) : "");

        fetch(apiCall, {
            method : "GET",
            headers: LIBRARY_AGENT
        }).then(res => res.json()).then(json=>{res(json)}).catch(err =>{rej();});
    })};

    fetchAddLyricsPromise = async (entry, method) => {
        const {id : trackId, ...search} = entry;
        //On error we abort
        try{
            const res1 = await JobLyrics.fetchLyrics(search, method);
            console.log("Lyrics res:",res1?.message);
            let res2;
            const fallBack = !(res1.plainLyrics || res1.instrumental);
            if(fallBack){
                search.track_name = stripFeaturing(search.track_name);
                search.album_name = stripFeaturing(search.album_name);
                search.artist_name = stripFeaturing(search.artist_name);
                res2 = await JobLyrics.fetchLyrics(search, method);
            }
            
            const lyrics = fallBack ? res2.syncedLyrics : res1.syncedLyrics;
            const db = getDatabase();
            db.prepare(`UPDATE tracks SET lyrics = ?, is_instrumental=? WHERE id=?`)
                .run(lyrics, lyrics=='' ? 1 : 0, trackId);
            console.log("Found lyrics:", lyrics?.slice(1,50));
        }
        catch(err){return;}
    };


    /**
     * Adds new job to the song search
     * @param {string} payload "album:${albumId}" or "track:${trackID}"
     */
    async addNewTask (payload){
        super.addNewTask(payload);
        const queries = payload.mode  === JobContainerSearchMode.ALBUM ? 
            this.getAlbumSignatures(payload.target) : this.getTrackSignature(payload.target)
        // Concatenates a list of ready queries to the job and increase total work count.
        // console.log("Working at restart : ",this.progress.working);
        this.newPendingJobs.push(...queries);
    
        // console.log("Queued", queries);
        this.updateProgress(this.progress.done, this.progress.total + queries.length);
    };

    getTrackSignature(trackID){
        const db = getDatabase();
        return db.prepare(`
            SELECT t.id as id, t.title as track_name, a.title as album_name, ar.name as artist_name,
                ROUND(t.duration) as duration
            FROM tracks t 
            JOIN albums a ON a.id = t.album
            JOIN artists_to_albums a2a ON a2a.taking_part = a.id 
            JOIN artists_descs ar on ar.id = a2a.artist
            WHERE id=?;`).all(trackID); 
    };
    getAlbumSignatures(albumID){
        const db = getDatabase();
        return db.prepare(`
            SELECT t.id as id, t.title as track_name, a.title as album_name, 
                a.id as album_id, ar.name as artist_name,
                ROUND(t.duration) as duration
            FROM tracks t 
            JOIN albums a ON a.id = t.album
            JOIN artists_to_albums a2a ON a2a.taking_part = a.id 
            JOIN artists_descs ar on ar.id = a2a.artist
            WHERE album_id=?;`).all(albumID); 
    };

    getWholeLibraryTracksSignature(){
        const db = getDatabase();
        //https://lrclib.net/docs : DURATION is crutial, in \pm 2s
        const signatures = db.prepare(`
            SELECT t.id as id, t.title as track_name, a.title as album_name, ar.name as artist_name,
                ROUND(t.duration) as duration
            FROM tracks t 
            JOIN albums a ON a.id = t.album
            JOIN artists_to_albums a2a ON a2a.taking_part = a.id 
            JOIN artists_descs ar on ar.id = a2a.artist;`).all();
        return signatures;
    }
}

module.exports = JobLyrics;