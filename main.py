from parser import parse_log_file
from detector import analyze_logs
from analyzer import aggregate_by_ip


def run_loglens(file_path):

    print("\nLogLens - Security Log Analysis")
    print("--------------------------------")

    # Phase 1: Parse log file
    parsed_logs = parse_log_file(file_path)

    # Phase 2: Detect attacks
    analyzed_logs = analyze_logs(parsed_logs)

    # Phase 2: Aggregate results by IP
    ip_summary = aggregate_by_ip(analyzed_logs)

    print("\nAnalysis Completed")
    print("------------------")

    print(f"Total log entries: {len(analyzed_logs)}")

    print("\nDetected Attacks:")

    for log in analyzed_logs:

        if log["type"] != "normal":
            print(
                f'{log["ip"]} -> '
                f'{log["type"]} -> '
                f'{log["severity"]}'
            )

    print("\nTop IP Summary:")

    for ip, data in ip_summary.items():

        print(
            f'{ip}: '
            f'{data["total_requests"]} requests, '
            f'{data["attacks"]} attacks'
        )

    return analyzed_logs, ip_summary


if __name__ == "__main__":

    run_loglens("demo.log")