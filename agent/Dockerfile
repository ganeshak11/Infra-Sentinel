FROM python:3.11-slim

# System deps for psutil + network tools
RUN apt-get update && apt-get install -y \
    procps \
    net-tools \
    iproute2 \
    iptables \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run as root (needed for iptables + /proc access)
CMD ["python", "main.py"]
