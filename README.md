# Binsr Home Inspection Report Generator

A Flask-based backend server that generates professional PDF inspection reports from JSON data.

## Project Overview

This application generates two types of PDF inspection reports:
1. **TREC Report** (`output_pdf.pdf`) - Texas Real Estate Commission formatted report
2. **Bonus Report** (`bonus_pdf.pdf`) - Custom-designed inspection report

## Features

- RESTful API for PDF generation
- Parses complex nested JSON inspection data
- Generates professional PDF reports with embedded images
- Handles video links as clickable URLs
- Comprehensive logging system
- Error handling and validation
- Performance optimized for sub-10 second generation

## Project Structure

```
binsr_challenge/
├── app/
│   ├── __init__.py              # Flask app factory
│   ├── config.py                # Configuration management
│   ├── routes/
│   │   ├── health.py            # Health check endpoints
│   │   └── reports.py           # PDF generation endpoints
│   ├── services/
│   │   ├── data_parser.py       # JSON parsing service
│   │   ├── trec_generator.py    # TREC PDF generator
│   │   └── bonus_generator.py   # Bonus PDF generator
│   └── utils/
│       └── logger.py            # Logging configuration
├── assets/                      # Input files
│   ├── inspection.json
│   ├── TREC_Template_Blank.pdf
│   ├── TREC_Sample_Filled.pdf
│   └── Binsr_Standard_Inspection_Output.pdf
├── output/                      # Generated PDFs
│   ├── output_pdf.pdf
│   └── bonus_pdf.pdf
├── logs/                        # Application logs
├── tests/                       # Unit and integration tests
├── prompts/                     # Development prompts
├── .env                         # Environment variables
├── requirements.txt             # Python dependencies
├── run.py                       # Application entry point
└── README.md
```

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd binsr_challenge
```

### 2. Create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Setup environment variables

```bash
cp .env.example .env
```

Edit `.env` file and configure as needed.

### 5. Verify setup

```bash
python run.py
```

The server should start on `http://127.0.0.1:5000`

## Usage

### Start the Server

```bash
python run.py
```

### API Endpoints

#### Health Check

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-02T12:00:00",
  "service": "Binsr Inspection Report Generator"
}
```

#### Generate TREC Report

```bash
curl -X POST http://localhost:5000/api/reports/trec
```

Response:
```json
{
  "status": "success",
  "message": "TREC report generated successfully",
  "file_path": "output/output_pdf.pdf",
  "file_name": "output_pdf.pdf",
  "generation_time": 4.2
}
```

#### Generate Bonus Report

```bash
curl -X POST http://localhost:5000/api/reports/bonus
```

#### Generate Both Reports

```bash
curl -X POST http://localhost:5000/api/reports/all
```

#### Download Report

```bash
curl http://localhost:5000/api/reports/download/output_pdf.pdf --output output_pdf.pdf
```

## Development

### Running Tests

```bash
pytest tests/
```

### Code Formatting

```bash
black app/ tests/
```

### Linting

```bash
flake8 app/ tests/
```

## Configuration

Key configuration options in `.env`:

- `FLASK_ENV`: Environment (development/production)
- `HOST`: Server host (default: 127.0.0.1)
- `PORT`: Server port (default: 5000)
- `INSPECTION_DATA_PATH`: Path to inspection.json
- `OUTPUT_DIR`: Directory for generated PDFs
- `LOGS_DIR`: Directory for log files

## Technologies Used

- **Flask 3.0.0** - Web framework
- **ReportLab 4.0.7** - PDF generation
- **Pillow 10.1.0** - Image processing
- **python-dotenv 1.0.0** - Environment configuration

## Performance

Target performance metrics:
- TREC Report: < 5 seconds
- Bonus Report: < 5 seconds
- Combined: < 10 seconds

## Logging

Logs are stored in the `logs/` directory:
- `app.log` - General application logs
- `error.log` - Error logs only

Log format: `timestamp - logger - level - file:line - message`

## Error Handling

The API returns consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "error": "Detailed error message"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created (report generated)
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

## Contributing

1. Follow PEP 8 style guide
2. Add unit tests for new features
3. Update documentation
4. Use type hints
5. Never use emojis in code

## License

This project is part of the Binsr Home Inspection Hackathon.

## Contact

For questions or issues, please contact the development team.