# LogLens Performance Note

## Log Processing Approach

LogLens processes log files using line-by-line reading.

The parser does not load the complete log file into memory
at the initial parsing stage.

This approach is suitable for large Apache/Nginx log files.

## Streaming vs Full File Loading

### Full File Loading

A traditional approach would load the complete log file
into memory before processing.

For example:

    with open("large.log", "r") as file:
        data = file.read()

For very large files, this can consume significant memory.

### LogLens Approach

LogLens reads the log file line-by-line:

    for line in open(
        file_path,
        "r",
        encoding="utf-8",
        errors="ignore"
    ):

        parsed_line = parse_log_line(line)

Only the current line is processed by the parser at a time.

## Advantages

- Lower initial memory usage
- Suitable for large log files
- Apache/Nginx logs can be processed sequentially
- Invalid lines can be skipped safely
- Regex parsing is performed per log entry

## Backend Processing

Large-file analysis is performed on the backend rather than
inside the browser.

The dashboard communicates with the Flask backend through
the upload and job-status APIs.

This prevents the browser from directly parsing the complete
log file.

## Asynchronous Processing

Uploaded log files are assigned a Job ID.

The processing flow is:

Upload Log
    ↓
Job ID Generated
    ↓
Background Processing
    ↓
Job Status Polling
    ↓
Analysis Completed
    ↓
Dashboard Results

## Conclusion

LogLens uses backend line-by-line parsing and asynchronous
job processing to provide a more scalable approach for
security log analysis.