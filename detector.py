import json
from collections import Counter


def load_signatures(file_path="signatures.json"):

    with open(
        file_path,
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(file)


def detect_attack(log_entry, signatures):

    text = log_entry["path"].lower()

    for attack_type, details in signatures.items():

        for pattern in details["patterns"]:

            if pattern.lower() in text:

                return {
                    "severity": details["severity"],
                    "type": attack_type
                }

    return {
        "severity": "low",
        "type": "normal"
    }


def analyze_logs(parsed_logs, threshold=3):

    signatures = load_signatures()

    results = []

    failed_attempts = Counter()

    failed_indices = {}

    for log_entry in parsed_logs:

        detection = detect_attack(
            log_entry,
            signatures
        )

        analyzed_entry = {
            **log_entry,
            "severity": detection["severity"],
            "type": detection["type"]
        }

        # Add the entry FIRST
        results.append(analyzed_entry)

        # Track failed login attempts
        if log_entry["status_code"] == 401:

            ip = log_entry["ip"]

            failed_attempts[ip] += 1

            if ip not in failed_indices:

                failed_indices[ip] = []

            current_index = len(results) - 1

            failed_indices[ip].append(
                current_index
            )

            # Mark all failed attempts as brute force
            # once the threshold is reached
            if failed_attempts[ip] >= threshold:

                for index in failed_indices[ip]:

                    results[index]["severity"] = "high"

                    results[index]["type"] = "brute_force"

    return results