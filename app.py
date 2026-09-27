from flask import Flask, jsonify, send_from_directory, request, send_file
from flask_cors import CORS

from parser import parse_log_file
from detector import analyze_logs
from analyzer import aggregate_by_ip
from geoip import get_country

from job_queue import create_job, get_job

import os
import json
from collections import Counter


app = Flask(__name__)

# Allow React frontend to connect with Flask backend
CORS(app)


BASE_FOLDER = os.path.dirname(__file__)

DASHBOARD_FOLDER = os.path.join(
    BASE_FOLDER,
    "dashboard"
)

UPLOAD_FOLDER = os.path.join(
    BASE_FOLDER,
    "uploads"
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


# =============================
# DASHBOARD
# =============================

@app.route("/")
def home():

    return send_from_directory(
        DASHBOARD_FOLDER,
        "index.html"
    )


@app.route("/dashboard.js")
def dashboard_js():

    return send_from_directory(
        DASHBOARD_FOLDER,
        "dashboard.js"
    )


# =============================
# ANALYZE FILE
# =============================

def analyze_file(file_path):

    parsed_logs = parse_log_file(file_path)

    analyzed_logs = analyze_logs(parsed_logs)

    ip_summary = aggregate_by_ip(
        analyzed_logs
    )

    total_requests = len(analyzed_logs)

    total_attacks = sum(
        1
        for log in analyzed_logs
        if log["type"] != "normal"
    )

    top_attacker = "-"

    if ip_summary:

        top_attacker = max(
            ip_summary,
            key=lambda ip:
            ip_summary[ip]["attacks"]
        )

    hourly_attacks = Counter()

    for log in analyzed_logs:

        if log["type"] != "normal":

            hour = log["timestamp"][12:14]

            hourly_attacks[hour] += 1

    attackers = []

    for ip, data in ip_summary.items():

        if data["attacks"] > 0:

            attack_types = data["attack_types"]

            attack_type = max(
                attack_types,
                key=attack_types.get
            )

            geo = get_country(ip)

            attackers.append({

                "ip": ip,

                "attacks":
                    data["attacks"],

                "type":
                    attack_type,

                "country":
                    geo["country"],

                "countryCode":
                    geo["country_code"]
            })

    attackers.sort(
        key=lambda item:
        item["attacks"],
        reverse=True
    )

    return {

        "status":
            "completed",

        "totalRequests":
            total_requests,

        "totalAttacks":
            total_attacks,

        "topAttacker":
            top_attacker,

        "attackers":
            attackers,

        "attacksPerHour": {

            "labels":
                sorted(
                    hourly_attacks.keys()
                ),

            "values": [
                hourly_attacks[hour]
                for hour in sorted(
                    hourly_attacks.keys()
                )
            ]
        }
    }


# =============================
# DEMO LOG
# =============================

@app.route(
    "/api/demo",
    methods=["GET"]
)
def load_demo():

    demo_file = os.path.join(
        BASE_FOLDER,
        "demo.log"
    )

    result = analyze_file(
        demo_file
    )

    return jsonify(result)


# =============================
# START ASYNC UPLOAD JOB
# =============================

@app.route(
    "/api/upload",
    methods=["POST"]
)
def upload_log():

    if "file" not in request.files:

        return jsonify({

            "status":
                "error",

            "message":
                "No file uploaded"

        }), 400

    file = request.files["file"]

    if file.filename == "":

        return jsonify({

            "status":
                "error",

            "message":
                "No file selected"

        }), 400

    if not file.filename.lower().endswith(".log"):

        return jsonify({

            "status":
                "error",

            "message":
                "Only .log files are allowed"

        }), 400

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    file.save(file_path)

    job_id = create_job(
        analyze_file,
        file_path
    )

    return jsonify({

        "status":
            "queued",

        "jobId":
            job_id,

        "filename":
            file.filename
    })


# =============================
# JOB STATUS
# =============================

@app.route(
    "/api/job/<job_id>",
    methods=["GET"]
)
def job_status(job_id):

    job = get_job(job_id)

    if job is None:

        return jsonify({

            "status":
                "error",

            "message":
                "Job not found"

        }), 404

    return jsonify({

        "jobId":
            job_id,

        "status":
            job["status"],

        "result":
            job["result"],

        "error":
            job["error"]
    })


# =============================
# EXPORT REPORT
# =============================

@app.route(
    "/api/export/<job_id>",
    methods=["GET"]
)
def export_report(job_id):

    job = get_job(job_id)

    if job is None:

        return jsonify({

            "status":
                "error",

            "message":
                "Job not found"

        }), 404

    if job["status"] != "completed":

        return jsonify({

            "status":
                "error",

            "message":
                "Job is not completed yet"

        }), 400

    report_data = job["result"]

    report_file = os.path.join(
        BASE_FOLDER,
        "report.json"
    )

    with open(
        report_file,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            report_data,
            file,
            indent=4
        )

    return send_file(

        report_file,

        as_attachment=True,

        download_name=
            "LogLens_Report.json",

        mimetype=
            "application/json"
    )


# =============================
# START SERVER
# =============================

if __name__ == "__main__":
    import os

    app.run(

        host="0.0.0.0",

        port=int(os.environ.get("PORT",5000)),

        debug=False
    )