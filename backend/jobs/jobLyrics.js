const { getDatabase } = require("../db");
const {Job, JobStatus} = require("./jobBase");
const JobsManager = require('../routes/jobs');
const { LyricsSearchMode, LIBRARY_AGENT } = require("../statics");
const { default: pLimit } = require("p-limit");

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

    /** @type  {string[]} */
    requestsCommits = [];
    /** @type  {import("p-limit").LimitFunction}*/
    jobQueueLimit = null;
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
    init = async ( jobKey, jobManager, payload) =>{
        const completeLibrary = payload.mode === LyricsSearchMode.ALL;

        this.currentConfig = require(jobManager.libraryConfig.configFilePath);

        this.jobQueueLimit = pLimit(this.currentConfig.ServerLyrics.concurrency);
        if(completeLibrary){
            const query = this.getWholeLibraryTracksSignature();
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

            await this.jobQueueLimit.map(query, async entry => 
                 this.fetchAddLyricsPromise(entry, API_SEARCH_METHODE.GET).then(() => {
                    if(this.status!=JobStatus.RUNNING )this.resumeJob()}))
            clearInterval(progressInterval);
            this.updateProgress(this.progress.total,this.progress.total)
        }
        this.stopJob();
        
    }
    static fetchLyrics = async (search, method) =>{
        const apiCall = method === API_SEARCH_METHODE.GET ?  findEntryAPiGet(search) 
                    : (API_SEARCH_METHODE.SEARCH ?  findEntryAPiSearch(search) : "");
        // console.log(apiCall);
        const response = await fetch(apiCall, {
            method : "GET",
            headers: LIBRARY_AGENT
        });
        if(!response.ok){
            if (response.status != 404){
                throw new Error(`No lyrics found for${search.track_name}`);
        }}
        const json = await response.json();
        return json;
    };
    fetchAddLyricsPromise = async (entry, method) => {
        const {id : trackId, ...search} = entry;
        const res1 = await JobLyrics.fetchLyrics(search, method);
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