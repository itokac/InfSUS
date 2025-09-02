# Koristi službenu Python baznu sliku
FROM python:3.10-slim

# Postavi radni direktorij
WORKDIR /app

# Kopiraj backend i frontend
COPY backend/ ./backend               
COPY frontend/ ./frontend          
COPY backend/nedded.txt ./nedded.txt      

# Instaliraj dodatke
RUN pip install --upgrade pip && pip install -r nedded.txt

# Otvori port
EXPOSE 8000

# Pokreni aplikaciju
CMD ["python", "backend/app.py"]
