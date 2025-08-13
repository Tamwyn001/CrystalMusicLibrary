const { existsSync } = require("fs");
const { getDatabase } = require("../db");
const {Job, JobStatus} = require("./jobBase");
const {parseFile} = require('music-metadata');
const { join, basename } = require("path");
class JobCD extends Job{
    /**
     * @type {any}
     */
    jobPromises;
    /**
     * @type {{ id: any; basename: any; album: any; }[]}
     */
    toCheckTracks;
    /**
     * @type {Map<any, any>}
     */
    trackIdToCD;
    /**
     * @type {Set<any>}
     */
    albumToLossless;
    
    fetchTracks () {
        var db = getDatabase();
        this.toCheckTracks = db.prepare("SELECT id,path,album FROM tracks").all()
        .map((/** @type {{ id: any; path: string; album: any; }} */ track) => {return {id: track.id, basename : basename(track.path), album : track.album}});
        this.updateProgress(0, this.toCheckTracks.length);
        this.trackIdToCD = new Map();
        this.albumToLossless = new Set();
        Promise.all(this.toCheckTracks.map( async ({id, basename, album}) => {
           
            var path = join(process.env.CML_DATA_PATH_RESOLVED, "music", basename);
            if(!existsSync(path)){
                return;
            }
            const fileMeta = await parseFile(path);
            this.resumeJob();
            this.upgradeProgress();
            this.progress.working = this.progress.total - this.progress.done;
            this.trackIdToCD.set(id, fileMeta.common.disk.no || 0);
            if(fileMeta.format.lossless === true){
                this.albumToLossless.add(album);
            }
        })).then(() => {
            // console.log(trackIdToCDLossless);
            this.writeIntoDatabase();
           
        });
    }

    async writeIntoDatabase () {
        var db = getDatabase();
        const updateAllIndecies = async () =>{
            var ids = this.trackIdToCD.keys();
            var insertCD = [];
            var insertLossless = []
            var placeholderCD = [];
            var placeholderLossless = [];
            // @ts-ignore
            for (let id of ids){
                insertCD.push(id, this.trackIdToCD.get(id));
                placeholderCD.push("(?,?)");
            }           
            // @ts-ignore
            for( let album of this.albumToLossless){
                placeholderLossless.push("(?,?)");
                insertLossless.push(album, 1);
            }
            const rollback = db.prepare("ROLLBACK");
            const begin = db.prepare("BEGIN");
            const commit = db.prepare("COMMIT");
            // CD ADD
            try{
                begin.run()
                db.prepare(`CREATE TEMP TABLE temp_disc(
                        id VARCAHR(36),
                        disc INT
                    );`).run();
                db.prepare(`INSERT INTO temp_disc VALUES ${placeholderCD.join(",")};`).run(insertCD);
                db.prepare(`UPDATE tracks SET 
                        disc = tmp.disc
                        FROM temp_disc AS tmp
                    WHERE tracks.id = tmp.id;`).run();
                db.prepare(`DROP TABLE temp.temp_disc;`).run();
                commit.run();
                console.log("   Sucessful write CD.");
            }
            catch{ (/** @type {any} */ err) => {
                console.log(err);
            }}
            finally{if(db.inTransaction){
                rollback.run();
            }}
            try{
                begin.run();
                db.prepare(`CREATE TEMP TABLE temp_loss(
                    id VARCAHR(36),
                    loss INT
                );`).run();
                db.prepare(`INSERT INTO temp_loss (id,loss) VALUES ${placeholderLossless.join(",")};`).run(insertLossless);
                db.prepare(`UPDATE albums SET 
                        lossless = tmp.loss
                        FROM temp_loss AS tmp
                    WHERE albums.id = tmp.id;`).run();
                db.prepare(`DROP TABLE temp.temp_loss;`).run();
                commit.run();
                console.log("   Successful write lossless.");
            }
            catch{ (/** @type {any} */ err) => {
                console.log(err);
            }}
            finally{if(db.inTransaction){
                rollback.run();
            }}

        } 
        updateAllIndecies().then(()=> {
            this.jobManager.stopJob(this.jobKey);
        });
    }

    upgradeProgress(){
        this.updateProgress(this.progress.done + 1, this.progress.total);
    }
    constructor()  {
        // @ts-ignore
        super(...arguments);
        this.status = JobStatus.PENDING;
        this.fetchTracks();
       
    }  
}
module.exports = JobCD;

