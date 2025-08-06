const express = require("express");
const router = express.Router(); 
const JobCD = require("../jobs/jobCD");
const { JobStatus } = require("../jobs/jobBase");
const JobFFT = require("../jobs/jobFFT");

class JobsManager {
    jobs = [];
    constructor(){

    }
    getAlljobs () {
        return this.jobs;
    }
    registerNewJob (jobKey) {
        const existingJob = this.jobs.find(job => job.jobKey === jobKey);
        if(existingJob) {
            existingJob.resumeJob();
            return;
        }
        var newJob = null;
        switch(jobKey){
            case 'JOB_CD':
                newJob = new JobCD("JOB_CD", this);
                break;
            case 'JOB_FFT':
                newJob = new JobFFT(true, "JOB_FFT", this);
                break;
        }
        if(!newJob) return;
        this.jobs.push(newJob);        

    }

    pauseJob (jobKey) {
        const existingJob = this.jobs.find(job => job.jobKey === jobKey);
        if(!existingJob) return;
        existingJob.pauseJob();
    }

    stopJob (jobKey) {
        const existingJobId = this.jobs.findIndex(job => job.jobKey === jobKey);
        if(existingJobId === -1) return;
        this.jobs[existingJobId].stopJob();
        this.jobs.splice(existingJobId, 1);
    }
}

const jobsManager = new JobsManager();

router.get("/status/:id", (req,res) =>{
   const job = jobsManager.getAlljobs().find(job => job.jobKey === req.params.id);
    res.json({status : job? job.status : JobStatus.INACTIVE
        , progress : job ? job.progress : null});
});

router.get("/run/:id", (req,res) =>{
    jobsManager.registerNewJob(req.params.id);
    res.json({message:""});
});

router.get("/pause/:id", (req,res) =>{
    jobsManager.pauseJob(req.params.id);
    res.json({message:""});
});

router.get("/stop/:id", (req,res) =>{
    jobsManager.stopJob(req.params.id);
    res.json({message:""});
});

module.exports = router;