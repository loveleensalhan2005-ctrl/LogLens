from collections import Counter


def aggregate_by_ip(analyzed_logs):

    ip_summary = {}

    for log in analyzed_logs:

        ip = log["ip"]

        if ip not in ip_summary:
            ip_summary[ip] = {
                "total_requests": 0,
                "attacks": 0,
                "attack_types": Counter()
            }

        ip_summary[ip]["total_requests"] += 1

        if log["type"] != "normal":
            ip_summary[ip]["attacks"] += 1
            ip_summary[ip]["attack_types"][log["type"]] += 1

    for ip in ip_summary:
        ip_summary[ip]["attack_types"] = dict(
            ip_summary[ip]["attack_types"]
        )

    return ip_summary