

const JobStatus = {
    PENDING : "pending",
    RUNNING : "running",
    PAUSED : "paused",
    INACTIVE : "inactive"
}
class Job {
    status = JobStatus.INACTIVE
    jobKey = "";
    jobManager;
    progress = {done : 0, total : 200};
    constructor(jobKey, jobManager) {
        this.status = JobStatus.PENDING; 
        this.jobKey = jobKey;
        this.jobManager = jobManager;
        console.log("[Job]", this.jobKey,"is initialising.");
    }
    updateProgress (done, total){
        this.progress = {done : done, total : total};
    }
    pauseJob () {
        this.status = JobStatus.PAUSED; 
        console.log("[Job]", this.jobKey,"is now paused.");
    }
    resumeJob () {
        this.status = JobStatus.RUNNING; 
        console.log("[Job]", this.jobKey,"is now running.");
    }
    stopJob () {
        this.status = JobStatus.INACTIVE; 
        console.log("[Job]", this.jobKey,"is now stoped.")  ;
    }
}
module.exports= {Job, JobStatus};
