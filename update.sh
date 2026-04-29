#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
#  🛡️  Cyber Kavach - Update Script
# ═══════════════════════════════════════════════════════════════════════════

set -e

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

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

# ── Banner ──────────────────────────────────────────────────────────────────
print_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║              🔄  Cyber Kavach - Update Script                 ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# ── Check Git ───────────────────────────────────────────────────────────────
check_git() {
    log_step "Checking Git repository..."
    
    if [ ! -d ".git" ]; then
        log_error "Not a Git repository"
        log_info "This script only works if you cloned via Git"
        exit 1
    fi
    
    log_success "Git repository found"
}

# ── Backup .env ─────────────────────────────────────────────────────────────
backup_env() {
    log_step "Backing up configuration..."
    
    if [ -f ".env" ]; then
        cp .env .env.backup
        log_success "Configuration backed up to .env.backup"
    else
        log_warning "No .env file found"
    fi
}

# ── Pull Updates ────────────────────────────────────────────────────────────
pull_updates() {
    log_step "Pulling latest updates..."
    
    local current_branch=$(git branch --show-current)
    log_info "Current branch: $current_branch"
    
    # Stash local changes
    if ! git diff-index --quiet HEAD --; then
        log_warning "You have uncommitted changes"
        read -p "$(echo -e ${YELLOW}Stash changes and continue? [y/N]: ${NC})" -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git stash
            log_info "Changes stashed"
        else
            log_error "Update cancelled"
            exit 1
        fi
    fi
    
    # Pull
    git pull origin "$current_branch"
    
    log_success "Updates pulled successfully"
}

# ── Restore .env ────────────────────────────────────────────────────────────
restore_env() {
    log_step "Restoring configuration..."
    
    if [ -f ".env.backup" ]; then
        mv .env.backup .env
        log_success "Configuration restored"
    fi
}

# ── Rebuild Containers ──────────────────────────────────────────────────────
rebuild_containers() {
    log_step "Rebuilding Docker containers..."
    
    log_info "Stopping existing containers..."
    if command -v docker-compose &> /dev/null; then
        docker-compose down
    else
        docker compose down
    fi
    
    log_info "Building new images..."
    if command -v docker-compose &> /dev/null; then
        docker-compose build --no-cache
    else
        docker compose build --no-cache
    fi
    
    log_info "Starting containers..."
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        docker compose up -d
    fi
    
    log_success "Containers rebuilt and started"
}

# ── Retrain ML Model (Optional) ─────────────────────────────────────────────
retrain_ml() {
    echo ""
    read -p "$(echo -e ${YELLOW}Do you want to retrain the ML model? [y/N]: ${NC})" -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_step "Retraining ML model..."
        
        cd agent/ml
        pip3 install -q -r requirements.txt
        python3 train_model.py
        cd ../..
        
        log_success "ML model retrained"
        
        # Restart agent to load new model
        log_info "Restarting agent..."
        if command -v docker-compose &> /dev/null; then
            docker-compose restart agent
        else
            docker compose restart agent
        fi
    fi
}

# ── Health Check ────────────────────────────────────────────────────────────
health_check() {
    log_step "Checking service health..."
    
    sleep 5
    
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        log_success "Backend is healthy"
    else
        log_warning "Backend may not be ready yet"
    fi
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend is healthy"
    else
        log_warning "Frontend may not be ready yet"
    fi
}

# ── Success Message ─────────────────────────────────────────────────────────
print_success() {
    echo ""
    echo -e "${GREEN}${BOLD}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║                  ✅  UPDATE COMPLETE!                         ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "${BOLD}🎯 Your Dashboard:${NC}"
    echo -e "   ${CYAN}http://localhost:3000${NC}"
    echo ""
    
    echo -e "${BOLD}📊 Check Status:${NC}"
    echo -e "   docker-compose ps"
    echo ""
}

# ── Main Flow ───────────────────────────────────────────────────────────────
main() {
    print_banner
    
    log_info "Starting Cyber Kavach update..."
    echo ""
    
    check_git
    backup_env
    pull_updates
    restore_env
    rebuild_containers
    retrain_ml
    health_check
    
    print_success
}

# ── Cleanup on Error ────────────────────────────────────────────────────────
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Update failed!"
        
        if [ -f ".env.backup" ]; then
            mv .env.backup .env
            log_info "Configuration restored from backup"
        fi
        
        echo ""
        log_info "You can try manual update:"
        echo "  git pull"
        echo "  docker-compose down && docker-compose up -d --build"
    fi
}

trap cleanup EXIT

# ── Run ─────────────────────────────────────────────────────────────────────
main
