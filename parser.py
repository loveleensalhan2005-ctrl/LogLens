import re


LOG_PATTERN = re.compile(
    r'(?P<ip>\S+) '
    r'\S+ '
    r'\S+ '
    r'\[(?P<timestamp>[^\]]+)\] '
    r'"(?P<method>[A-Z]+) (?P<path>.*?) HTTP/\S+" '
    r'(?P<status>\d{3}) '
    r'(?P<size>\S+) '
    r'"(?P<user_agent>[^"]*)"'
)


def parse_log_line(line):
    match = LOG_PATTERN.match(line.strip())

    if not match:
        return None

    data = match.groupdict()

    return {
        "ip": data["ip"],
        "timestamp": data["timestamp"],
        "method": data["method"],
        "path": data["path"],
        "status_code": int(data["status"]),
        "user_agent": data["user_agent"]
    }


def parse_log_file(file_path):
    """
    Reads the log file line-by-line.
    This avoids loading the complete file into memory.
    """

    for line in open(
        file_path,
        "r",
        encoding="utf-8",
        errors="ignore"
    ):
        parsed_line = parse_log_line(line)

        if parsed_line:
            yield parsed_line


if __name__ == "__main__":

    total_lines = 0

    print("\nParsed Log Results:")

    for result in parse_log_file("demo.log"):
        print(result)
        total_lines += 1

    print(f"\nTotal parsed lines: {total_lines}")