
const JobStatus = {
    PENDING : "pending",
    RUNNING : "running",
    PAUSED : "paused",
    INACTIVE : "inactive",
    STOPPING : "stopping" 
}
class Job {
    status = JobStatus.INACTIVE
    jobKey = "";
    jobManager;
    progress = {done : 0, total : 0, working : 0};

    
    /**
     * @param {string} jobKey
     * @param {JobManager} jobManager 
     */
    constructor(jobKey, jobManager, payload) {
        this.status = JobStatus.PENDING; 
        this.jobKey = jobKey;
        this.jobManager = jobManager;
        console.log("[Job]", this.jobKey,"is initialising.");
    }
    updateProgress (done, total){
        this.progress.done = done;
        this.progress.total = total;
    }
    pauseJob () {
        this.status = JobStatus.PAUSED; 
        console.log("[Job]", this.jobKey,"is now paused.");
    }
    resumeJob () {
        if(this.status === JobStatus.RUNNING) {return;}
        this.status = JobStatus.RUNNING; 
        console.log("[Job]", this.jobKey,"is now running.");
    }
    stopJob () {
        // this.status = JobStatus.INACTIVE; 
        console.log("[Job]", this.jobKey,"is now stoped.")  ;
    }
    addNewTask(payload){}
}
module.exports= {Job, JobStatus};
