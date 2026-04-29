#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
#  🛡️  Cyber Kavach - Installation Script
#  AI-Powered Real-Time Cloud Threat Detection & Response Platform
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── ASCII Banner ────────────────────────────────────────────────────────────
print_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   ██████╗██╗   ██╗██████╗ ███████╗██████╗                     ║
    ║  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗                    ║
    ║  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝                    ║
    ║  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗                    ║
    ║  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║                    ║
    ║   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝                    ║
    ║                                                               ║
    ║   ██╗  ██╗ █████╗ ██╗   ██╗ █████╗  ██████╗██╗  ██╗           ║
    ║   ██║ ██╔╝██╔══██╗██║   ██║██╔══██╗██╔════╝██║  ██║           ║
    ║   █████╔╝ ███████║██║   ██║███████║██║     ███████║           ║
    ║   ██╔═██╗ ██╔══██║╚██╗ ██╔╝██╔══██║██║     ██╔══██║           ║
    ║   ██║  ██╗██║  ██║ ╚████╔╝ ██║  ██║╚██████╗██║  ██║           ║
    ║   ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝           ║
    ║                                                               ║
    ║        AI-Powered Real-Time Threat Detection Platform         ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# ── Helper Functions ────────────────────────────────────────────────────────
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_step() {
    echo -e "\n${BOLD}${CYAN}▶ $1${NC}"
}

# ── Dependency Checks ───────────────────────────────────────────────────────
check_dependencies() {
    log_step "Checking dependencies..."
    
    local missing_deps=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    else
        log_success "Docker found: $(docker --version | head -n1)"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing_deps+=("docker-compose")
    else
        if command -v docker-compose &> /dev/null; then
            log_success "Docker Compose found: $(docker-compose --version)"
        else
            log_success "Docker Compose found: $(docker compose version)"
        fi
    fi
    
    # Check Python (for ML model training)
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    else
        log_success "Python3 found: $(python3 --version)"
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        missing_deps+=("pip3")
    else
        log_success "pip3 found"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    else
        log_success "Git found: $(git --version)"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        echo ""
        log_info "Please install missing dependencies:"
        echo ""
        echo "  Ubuntu/Debian:"
        echo "    sudo apt-get update"
        echo "    sudo apt-get install -y docker.io docker-compose python3 python3-pip git"
        echo ""
        echo "  CentOS/RHEL:"
        echo "    sudo yum install -y docker docker-compose python3 python3-pip git"
        echo ""
        echo "  macOS:"
        echo "    brew install docker docker-compose python3 git"
        echo ""
        exit 1
    fi
}

# ── Port Availability Check ─────────────────────────────────────────────────
check_ports() {
    log_step "Checking port availability..."
    
    local ports=(3000 8000)
    local ports_in_use=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$port "; then
            ports_in_use+=($port)
        fi
    done
    
    if [ ${#ports_in_use[@]} -ne 0 ]; then
        log_warning "Ports already in use: ${ports_in_use[*]}"
        if [ -t 0 ]; then
            echo ""
            read -p "$(echo -e ${YELLOW}Do you want to continue anyway? [y/N]: ${NC})" -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_error "Installation cancelled"
                exit 1
            fi
        else
            log_warning "Non-interactive mode: Continuing anyway"
        fi
    else
        log_success "Ports 3000 and 8000 are available"
    fi
}

# ── Environment Configuration ───────────────────────────────────────────────
configure_env() {
    log_step "Configuring environment variables..."
    
    if [ -f .env ]; then
        log_warning ".env file already exists"
        if [ -t 0 ]; then
            read -p "$(echo -e ${YELLOW}Do you want to reconfigure? [y/N]: ${NC})" -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Using existing .env file"
                return
            fi
        else
            log_info "Non-interactive mode: Using existing .env file"
            return
        fi
    fi
    
    # Copy template
    cp .env.example .env
    log_success "Created .env from template"
    
    # Check if running in interactive mode
    if [ ! -t 0 ]; then
        log_warning "Non-interactive mode detected"
        log_info "Using default configuration - edit .env file to customize"
        log_info "Configuration file: $(pwd)/.env"
        return
    fi
    
    echo ""
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  Configuration Setup${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Email Configuration
    echo -e "${BOLD}📧 Email Alert Configuration${NC}"
    echo -e "${YELLOW}(For Gmail: Use App Password from https://myaccount.google.com/apppasswords)${NC}"
    echo -e "${YELLOW}(Press Enter to skip and configure later in .env file)${NC}"
    echo ""
    
    read -p "SMTP User (your Gmail): " smtp_user || smtp_user=""
    if [ -z "$smtp_user" ]; then
        log_warning "Skipping email configuration - configure manually in .env"
        smtp_user="your_email@gmail.com"
        smtp_pass="xxxx xxxx xxxx xxxx"
        alert_email="recipient@gmail.com"
    else
        read -sp "SMTP Password (App Password): " smtp_pass || smtp_pass=""
        echo ""
        read -p "Alert Recipient Email: " alert_email || alert_email=""
        echo ""
    fi
    
    # AI Configuration
    echo ""
    echo -e "${BOLD}🤖 AI Copilot Configuration${NC}"
    echo -e "${YELLOW}(Optional: Press Enter to skip AI-powered threat analysis)${NC}"
    echo ""
    echo "Supported providers:"
    echo "  1) Gemini (Google)"
    echo "  2) OpenAI (GPT)"
    echo "  3) Anthropic (Claude)"
    echo "  4) Groq"
    echo "  5) Skip AI features"
    echo ""
    read -p "Select provider [1-5] (default: 5): " llm_choice || llm_choice="5"
    llm_choice=${llm_choice:-5}
    
    llm_provider=""
    api_key=""
    
    case $llm_choice in
        1)
            llm_provider="gemini"
            read -p "Gemini API Key: " api_key || api_key=""
            if [ -n "$api_key" ]; then
                sed -i "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=$api_key/" .env
            fi
            ;;
        2)
            llm_provider="openai"
            read -p "OpenAI API Key: " api_key || api_key=""
            if [ -n "$api_key" ]; then
                sed -i "s/# OPENAI_API_KEY=.*/OPENAI_API_KEY=$api_key/" .env
            fi
            ;;
        3)
            llm_provider="anthropic"
            read -p "Anthropic API Key: " api_key || api_key=""
            if [ -n "$api_key" ]; then
                sed -i "s/# ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$api_key/" .env
            fi
            ;;
        4)
            llm_provider="groq"
            read -p "Groq API Key: " api_key || api_key=""
            if [ -n "$api_key" ]; then
                sed -i "s/# GROQ_API_KEY=.*/GROQ_API_KEY=$api_key/" .env
            fi
            ;;
        5)
            log_info "Skipping AI features"
            llm_provider="none"
            ;;
        *)
            log_warning "Invalid choice, skipping AI features"
            llm_provider="none"
            ;;
    esac
    
    # Update .env file
    if [ "$llm_provider" != "none" ] && [ -n "$llm_provider" ]; then
        sed -i "s/LLM_PROVIDER=.*/LLM_PROVIDER=$llm_provider/" .env
    fi
    
    if [ -n "$smtp_user" ]; then
        sed -i "s/SMTP_USER=.*/SMTP_USER=$smtp_user/" .env
    fi
    if [ -n "$smtp_pass" ]; then
        sed -i "s/SMTP_PASS=.*/SMTP_PASS=$smtp_pass/" .env
    fi
    if [ -n "$alert_email" ]; then
        sed -i "s/ALERT_EMAIL=.*/ALERT_EMAIL=$alert_email/" .env
    fi
    
    log_success "Environment configured successfully"
}

# ── ML Model Training ───────────────────────────────────────────────────────
train_ml_model() {
    log_step "Training ML anomaly detection model..."
    
    if [ -f agent/ml/anomaly_model.pkl ] && [ -f agent/ml/scaler.pkl ]; then
        log_warning "ML model already exists"
        if [ -t 0 ]; then
            read -p "$(echo -e ${YELLOW}Do you want to retrain? [y/N]: ${NC})" -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Using existing ML model"
                return
            fi
        else
            log_info "Non-interactive mode: Using existing ML model"
            return
        fi
    fi
    
    cd agent/ml
    
    # Install dependencies
    log_info "Installing ML dependencies..."
    pip3 install -q -r requirements.txt
    
    # Train model
    log_info "Training Isolation Forest model (this may take a minute)..."
    python3 train_model.py
    
    cd ../..
    
    if [ -f agent/ml/anomaly_model.pkl ] && [ -f agent/ml/scaler.pkl ]; then
        log_success "ML model trained successfully"
    else
        log_error "ML model training failed"
        exit 1
    fi
}

# ── Docker Build & Launch ───────────────────────────────────────────────────
launch_containers() {
    log_step "Building and launching Docker containers..."
    
    # Stop existing containers
    log_info "Stopping existing containers (if any)..."
    docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true
    
    # Build and start
    log_info "Building containers (this may take a few minutes)..."
    if command -v docker-compose &> /dev/null; then
        docker-compose build --no-cache
        docker-compose up -d
    else
        docker compose build --no-cache
        docker compose up -d
    fi
    
    log_success "Containers launched"
}

# ── Health Check ────────────────────────────────────────────────────────────
wait_for_services() {
    log_step "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            log_success "Backend is healthy"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Backend failed to start"
        log_info "Check logs with: docker-compose logs backend"
        exit 1
    fi
    
    # Wait a bit for frontend
    sleep 3
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend is healthy"
    else
        log_warning "Frontend may not be ready yet (give it a few more seconds)"
    fi
}

# ── Success Message ─────────────────────────────────────────────────────────
print_success() {
    echo ""
    echo -e "${GREEN}${BOLD}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║                  ✅  INSTALLATION COMPLETE!                   ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "${BOLD}🎯 Quick Start:${NC}"
    echo ""
    echo -e "  ${CYAN}Dashboard:${NC}     http://localhost:3000"
    echo -e "  ${CYAN}Backend API:${NC}   http://localhost:8000"
    echo -e "  ${CYAN}API Docs:${NC}      http://localhost:8000/docs"
    echo ""
    
    echo -e "${BOLD}📊 Useful Commands:${NC}"
    echo ""
    echo -e "  ${YELLOW}View logs:${NC}         docker-compose logs -f"
    echo -e "  ${YELLOW}Stop services:${NC}     docker-compose down"
    echo -e "  ${YELLOW}Restart services:${NC}  docker-compose restart"
    echo -e "  ${YELLOW}View status:${NC}       docker-compose ps"
    echo ""
    
    echo -e "${BOLD}🧪 Test Detection:${NC}"
    echo ""
    echo -e "  ${YELLOW}Brute Force:${NC}       ./scripts/simulate/brute_force_sim.sh"
    echo -e "  ${YELLOW}Reverse Shell:${NC}     ./scripts/simulate/reverse_shell_sim.sh"
    echo -e "  ${YELLOW}Network Anomaly:${NC}   ./scripts/simulate/network_anomaly_sim.sh"
    echo ""
    
    echo -e "${BOLD}🛡️  Cyber Kavach is now protecting your system!${NC}"
    echo ""
}

# ── Main Installation Flow ──────────────────────────────────────────────────
main() {
    print_banner
    
    log_info "Starting Cyber Kavach installation..."
    echo ""
    
    # Pre-flight checks
    check_dependencies
    check_ports
    
    # Configuration
    configure_env
    
    # ML Setup
    train_ml_model
    
    # Launch
    launch_containers
    
    # Verify
    wait_for_services
    
    # Success
    print_success
}

# ── Cleanup on Error ────────────────────────────────────────────────────────
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Installation failed!"
        log_info "Cleaning up..."
        docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true
        echo ""
        log_info "Check the error messages above for details"
        log_info "For help, visit: https://github.com/ganeshak11/Infra-Sentinel/issues"
    fi
}

trap cleanup EXIT

# ── Run ─────────────────────────────────────────────────────────────────────
main
