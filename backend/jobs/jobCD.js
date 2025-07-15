const { promises } = require("readline");
const { getDatabase } = require("../db");
const {Job, JobStatus} = require("./jobBase");
const {parseFile} = require('music-metadata');
const { join, basename } = require("path");

class JobCD extends Job{
    jobPromises;
    toCheckTracks;
    trackIdToCDLossless
    
    fetchTracks () {
        var db = getDatabase();
        this.toCheckTracks = db.prepare("SELECT id,path FROM tracks").all().map(track => {return {id: track.id, basename : basename(track.path)}});
        this.updateProgress(0, this.toCheckTracks.length);
        this.trackIdToCDLossless = new Map();
        Promise.all(this.toCheckTracks.map( async ({id, basename}) => {

            var path = join(process.env.CML_DATA_PATH_RESOLVED, "music", basename);
            const fileMeta = await parseFile(path);
            this.upgradeProgress();
            this.trackIdToCDLossless.set(id, {disc : fileMeta.common.disk.no || 0, lossless : fileMeta.format.lossless});
        })).then(() => {
            // console.log(trackIdToCDLossless);
            this.writeIntoDatabase();
           
        });
    }

    async writeIntoDatabase () {
        var db = getDatabase();
        const updateAllIndecies = async () =>{
            var ids = this.trackIdToCDLossless.keys();
            var insertCD = [];
            var placeholder = [];
            for (let id of ids){
                 this.trackIdToCDLossless.get(id);
                insertCD.push(id, this.trackIdToCDLossless.get(id).disc);
                placeholder.push("(?,?)");
            }
            
            const query = `
                CREATE TEMP TABLE temp_disc(
                    id VARCAHR(36),
                    disc INT
                );
                INSERT INTO temp_disc VALUES ${placeholder.join(",")};

                UPDATE tracks SET 
                    disc = tmp.disc
                    FROM temp_disc AS tmp
                WHERE tracks.id = tmp.id;
            `;
            db.prepare(query).run(insertCD);
        } 
        await updateAllIndecies();
        this.jobManager.stopJob(this.jobKey);
    }

    upgradeProgress(){
        this.updateProgress(this.progress.done + 1, this.progress.total);
    }
    constructor()  {
        super(...arguments);
        this.resumeJob();
        setTimeout(() => {this.fetchTracks();}, 1000);
        
    }  
}
module.exports = JobCD;

