#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
#  🛡️  Cyber Kavach - Uninstall Script
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
    echo -e "${RED}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║              🗑️  Cyber Kavach - Uninstaller                   ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# ── Confirmation ────────────────────────────────────────────────────────────
confirm_uninstall() {
    echo ""
    log_warning "This will remove:"
    echo "  • All Docker containers (agent, backend, frontend)"
    echo "  • All Docker images"
    echo "  • Alert data (alerts.json)"
    echo "  • ML models (anomaly_model.pkl, scaler.pkl)"
    echo "  • Environment configuration (.env)"
    echo ""
    
    read -p "$(echo -e ${RED}${BOLD}Are you sure you want to uninstall? [y/N]: ${NC})" -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Uninstall cancelled"
        exit 0
    fi
}

# ── Stop Containers ─────────────────────────────────────────────────────────
stop_containers() {
    log_step "Stopping Docker containers..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose down -v 2>/dev/null || true
    else
        docker compose down -v 2>/dev/null || true
    fi
    
    log_success "Containers stopped"
}

# ── Remove Images ───────────────────────────────────────────────────────────
remove_images() {
    log_step "Removing Docker images..."
    
    local images=$(docker images | grep -E "Infra-Sentinel" | awk '{print $3}')
    
    if [ -n "$images" ]; then
        echo "$images" | xargs docker rmi -f 2>/dev/null || true
        log_success "Images removed"
    else
        log_info "No Cyber Kavach images found"
    fi
}

# ── Clean Data ──────────────────────────────────────────────────────────────
clean_data() {
    log_step "Cleaning data files..."
    
    local files_to_remove=(
        "backend/alerts.json"
        "backend/alert.json"
        "agent/ml/anomaly_model.pkl"
        "agent/ml/scaler.pkl"
        ".env"
    )
    
    for file in "${files_to_remove[@]}"; do
        if [ -f "$file" ]; then
            rm -f "$file"
            log_info "Removed $file"
        fi
    done
    
    log_success "Data cleaned"
}

# ── Optional: Remove Directory ──────────────────────────────────────────────
remove_directory() {
    echo ""
    read -p "$(echo -e ${YELLOW}Do you want to remove the entire project directory? [y/N]: ${NC})" -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd ..
        local dir_name=$(basename "$OLDPWD")
        rm -rf "$OLDPWD"
        log_success "Project directory removed"
        echo ""
        log_info "Cyber Kavach has been completely uninstalled"
    else
        log_info "Project directory kept (you can manually delete it later)"
    fi
}

# ── Success Message ─────────────────────────────────────────────────────────
print_success() {
    echo ""
    echo -e "${GREEN}${BOLD}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║                ✅  UNINSTALL COMPLETE!                        ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "${BOLD}Thank you for using Cyber Kavach!${NC}"
    echo ""
    echo -e "To reinstall: ${CYAN}./install.sh${NC}"
    echo ""
}

# ── Main Flow ───────────────────────────────────────────────────────────────
main() {
    print_banner
    confirm_uninstall
    
    stop_containers
    remove_images
    clean_data
    
    print_success
    
    remove_directory
}

# ── Run ─────────────────────────────────────────────────────────────────────
main
