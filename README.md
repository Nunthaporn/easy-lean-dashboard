# EASY LEAN-Line Dashboard

Web application replacement for the Power BI EASY LEAN-Line dashboard.

## Stack
- Frontend: React + TypeScript + Vite + Apache ECharts
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL

## Database naming rule
Excel sheet names are PostgreSQL table names converted to lowercase. Column names are kept exactly as imported from Excel, so SQL uses quoted identifiers such as `"Min Output"`, `"EasyLean Line"`, and `"FAC-LINE"`.

## Run backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Edit `backend/.env` to match your local PostgreSQL connection.

## Run frontend
```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173

## Important calculations
- EFF% = SUM(Min Output) / SUM(Min Input)
- EFF% EZLcard = same ratio, limited to nonblank EasyLean Line
- CountLine = DISTINCTCOUNT(FAC-LINE)
- SumPcs = SUM(Output pcs)
- PPH is algebraically equivalent to `SUM(Output pcs) * 60 / SUM(Min Input)` for a nonzero manpower context, matching the supplied DAX chain.
- Min Produce is currently mapped to SUM(Min Output)
- #Of Operator is currently mapped to SUM(Man_%Out)

If the original Power BI measures for Min Produce or #Of Operator use different DAX, update only the matching expressions in `backend/app/queries/easylean_queries.py`.
