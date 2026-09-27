
# LogLens

## Security Log Analysis and Attack Detection Dashboard

LogLens is a lightweight security log analysis system that analyzes Apache/Nginx server logs and detects common web attacks using signature-based pattern matching and behavioral analysis.

## Features

- Apache/Nginx Common Log Format parsing
- Line-by-line log processing
- SQL Injection detection
- XSS detection
- Directory Traversal detection
- Brute-force detection using repeated HTTP 401 responses
- Attack severity classification
- IP-based attack aggregation
- Attacks-per-hour timeline
- Top Attackers table
- GeoIP country lookup
- Asynchronous job processing with Job IDs
- Log file upload and analysis
- Export Report
- Pre-loaded Demo Log
- Large-file streaming approach
- Live deployment

## Detected Attack Types

| Attack Type | Detection Method |
|---|---|
| SQL Injection | Signature-based pattern matching |
| XSS | Signature-based pattern matching |
| Directory Traversal | Path signature matching |
| Brute Force | Repeated HTTP 401 responses |

## Project Workflow

Upload Log  
↓  
Parse Log  
↓  
Detect Attacks  
↓  
Classify Severity  
↓  
Aggregate by IP  
↓  
Generate Report  
↓  
Visualize Results

## Project Structure

- `parser.py` - Apache/Nginx log parser
- `detector.py` - Attack detection engine
- `analyzer.py` - IP-based attack aggregation
- `signatures.json` - Attack signature database
- `geoip.py` - GeoIP country lookup
- `job_queue.py` - Background job processing
- `app.py` - Flask web application
- `main.py` - Main analysis workflow
- `demo.log` - Pre-loaded demonstration log
- `dashboard/` - Web dashboard
- `PERFORMANCE.md` - Performance and streaming notes
- `requirements.txt` - Python dependencies
- `Procfile` - Render deployment configuration

## Demo

The Demo Log demonstrates detection of:

- SQL Injection
- XSS
- Directory Traversal
- Brute Force

The dashboard displays attack counts, attack timeline, top attackers, severity information and GeoIP information.

## Large File Processing

LogLens processes log files line-by-line instead of loading the complete file into memory at once.

This streaming approach helps reduce memory usage when processing large server log files.

## Technology Stack

- Python
- Flask
- Regular Expressions
- JSON
- HTML
- CSS
- JavaScript
- Chart.js
- Leaflet
- GeoIP

## Deployment

LogLens is deployed as a live web service using Render.

The application supports:

- Log file upload
- Job ID generation
- Background processing
- Job status monitoring
- Result visualization
- Report export

## Project Objective

The objective of LogLens is to provide a lightweight SIEM-style security log analysis solution that can identify suspicious activity in server logs and present the results through an easy-to-understand security dashboard.

## Project Phases

### Phase 1 - Parsing

- Apache/Nginx log parsing
- Regex-based field extraction
- Line-by-line processing

### Phase 2 - Detection

- Signature database
- SQL Injection detection
- XSS detection
- Directory Traversal detection
- Brute-force detection
- Severity classification
- IP aggregation

### Phase 3 - Visualization

- Attacks-per-hour timeline
- Top Attackers
- GeoIP information
- Security dashboard

### Phase 4 - Optimization and Deployment

- Job queue processing
- Job ID and status tracking
- Report export
- Large-file streaming approach
- Live deployment
