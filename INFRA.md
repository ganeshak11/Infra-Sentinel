# 🐳 Docker & Infra — Owner: Ganesh

**Owner:** Ganesh  
**Responsibility:** `docker-compose.yml`, all `Dockerfile`s, `.env.example`, deployment

---

## What to Build

### `docker-compose.yml`
Wire all 3 services:

```yaml
services:
  agent:
    build: ./agent
    network_mode: "host"       # REQUIRED for log/process access
    env_file: .env
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

### `agent/Dockerfile`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `frontend/Dockerfile`
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

---

## Run Everything
```bash
cp .env.example .env
# fill in .env values
docker-compose up --build
```
