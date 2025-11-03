# Quick Reference Guide

## Start Development

```bash
# Navigate to project
cd /Users/sriujjwalreddyb/binsr_challenge

# Activate virtual environment
source venv/bin/activate

# Start Flask server
python run.py
```

## Test Endpoints

```bash
# Health check
curl http://localhost:5000/api/health

# Generate TREC report
curl -X POST http://localhost:5000/api/reports/trec

# Generate bonus report
curl -X POST http://localhost:5000/api/reports/bonus

# Generate both
curl -X POST http://localhost:5000/api/reports/all

# Download report
curl http://localhost:5000/api/reports/download/output_pdf.pdf -o output_pdf.pdf
```

## Project Structure

```
app/
├── __init__.py           # App factory
├── config.py             # Configuration
├── routes/
│   ├── health.py         # Health endpoints
│   └── reports.py        # Report endpoints
├── services/
│   ├── data_parser.py    # JSON parser (DONE)
│   ├── trec_generator.py # TREC PDF (TODO)
│   └── bonus_generator.py # Bonus PDF (TODO)
└── utils/
    └── logger.py         # Logging setup
```

## Key Files

- `run.py` - Start server
- `.env` - Configuration
- `requirements.txt` - Dependencies
- `assets/inspection.json` - Input data
- `output/` - Generated PDFs
- `logs/` - Application logs

## Development Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
pytest tests/

# Format code
black app/ tests/

# Lint code
flake8 app/ tests/
```

## Next Steps

1. Implement TREC PDF generator (`app/services/trec_generator.py`)
2. Create image handler (`app/services/image_handler.py`)
3. Implement bonus PDF generator (`app/services/bonus_generator.py`)
4. Add tests
5. Optimize performance

## Documentation

- `README.md` - Full documentation
- `ANALYSIS.md` - Implementation strategy
- `SETUP_SUMMARY.md` - What was built
- `GETTING_STARTED.md` - Complete guide
- `prompts/` - Development guides
