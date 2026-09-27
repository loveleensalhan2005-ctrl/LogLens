from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
from threading import Lock


# Background worker pool
executor = ThreadPoolExecutor(max_workers=2)


# Stores job information
jobs = {}

jobs_lock = Lock()


def create_job(task, *args):

    job_id = str(uuid4())

    with jobs_lock:

        jobs[job_id] = {
            "status": "queued",
            "result": None,
            "error": None
        }

    future = executor.submit(
        run_job,
        job_id,
        task,
        *args
    )

    return job_id


def run_job(job_id, task, *args):

    with jobs_lock:

        jobs[job_id]["status"] = "processing"

    try:

        result = task(*args)

        with jobs_lock:

            jobs[job_id]["status"] = "completed"
            jobs[job_id]["result"] = result

    except Exception as error:

        with jobs_lock:

            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = str(error)


def get_job(job_id):

    with jobs_lock:

        return jobs.get(job_id)