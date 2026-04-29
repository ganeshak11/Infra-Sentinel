#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
#  🛡️  Cyber Kavach - Quick Install (One-Liner)
#  curl -fsSL https://raw.githubusercontent.com/ganeshak11/Infra-Sentinel/main/quick-install.sh | bash
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Configuration ───────────────────────────────────────────────────────────
REPO_URL="https://github.com/ganeshak11/Infra-Sentinel.git"
INSTALL_DIR="$HOME/Infra-Sentinel"
BRANCH="main"

# ── ASCII Banner ────────────────────────────────────────────────────────────
print_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
    ╔════════════════════════════════════════════════════════════╗
    ║                                                            ║
    ║   ██████╗██╗   ██╗██████╗ ███████╗██████╗                  ║
    ║  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗                 ║
    ║  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝                 ║
    ║  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗                 ║
    ║  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║                 ║
    ║   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝                 ║
    ║                                                            ║
    ║   ██╗  ██╗ █████╗ ██╗   ██╗ █████╗  ██████╗██╗  ██╗        ║
    ║   ██║ ██╔╝██╔══██╗██║   ██║██╔══██╗██╔════╝██║  ██║        ║
    ║   █████╔╝ ███████║██║   ██║███████║██║     ███████║        ║
    ║   ██╔═██╗ ██╔══██║╚██╗ ██╔╝██╔══██║██║     ██╔══██║        ║
    ║   ██║  ██╗██║  ██║ ╚████╔╝ ██║  ██║╚██████╗██║  ██║        ║
    ║   ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝        ║
    ║                                                            ║
    ║        AI-Powered Real-Time Threat Detection Platform      ║
    ║                    Quick Install Script                    ║
    ║                                                            ║
    ╚════════════════════════════════════════════════════════════╝
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
    
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi
    
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    fi
    
    if ! command -v pip3 &> /dev/null; then
        missing_deps+=("pip3")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        echo ""
        log_info "Install them with:"
        echo ""
        echo "  Ubuntu/Debian:"
        echo "    sudo apt-get update"
        echo "    sudo apt-get install -y git docker.io docker-compose python3 python3-pip curl"
        echo ""
        echo "  CentOS/RHEL:"
        echo "    sudo yum install -y git docker docker-compose python3 python3-pip curl"
        echo ""
        echo "  macOS:"
        echo "    brew install git docker docker-compose python3 curl"
        echo ""
        exit 1
    fi
    
    log_success "All dependencies found"
}

# ── Clone Repository ────────────────────────────────────────────────────────
clone_repo() {
    log_step "Cloning Cyber Kavach repository..."
    
    if [ -d "$INSTALL_DIR" ]; then
        log_warning "Directory $INSTALL_DIR already exists"
        read -p "$(echo -e ${YELLOW}Do you want to remove it and reinstall? [y/N]: ${NC})" -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Removing existing installation..."
            rm -rf "$INSTALL_DIR"
        else
            log_error "Installation cancelled"
            exit 1
        fi
    fi
    
    log_info "Cloning from $REPO_URL..."
    git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
    
    if [ -d "$INSTALL_DIR" ]; then
        log_success "Repository cloned to $INSTALL_DIR"
    else
        log_error "Failed to clone repository"
        exit 1
    fi
}

# ── Run Installation Script ─────────────────────────────────────────────────
run_installer() {
    log_step "Running installation script..."
    
    cd "$INSTALL_DIR"
    
    if [ ! -f "install.sh" ]; then
        log_error "install.sh not found in repository"
        exit 1
    fi
    
    chmod +x install.sh
    
    # Run the main installer
    ./install.sh
}

# ── Success Message ─────────────────────────────────────────────────────────
print_success() {
    echo ""
    echo -e "${GREEN}${BOLD}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║              ✅  QUICK INSTALLATION COMPLETE!                 ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "${BOLD}📁 Installation Directory:${NC}"
    echo -e "   $INSTALL_DIR"
    echo ""
    
    echo -e "${BOLD}🎯 Access Your Dashboard:${NC}"
    echo -e "   ${CYAN}http://localhost:3000${NC}"
    echo ""
    
    echo -e "${BOLD}📚 Next Steps:${NC}"
    echo -e "   cd $INSTALL_DIR"
    echo -e "   ./scripts/simulate/brute_force_sim.sh  ${YELLOW}# Test detection${NC}"
    echo ""
}

# ── Main Flow ───────────────────────────────────────────────────────────────
main() {
    print_banner
    
    log_info "Starting Cyber Kavach quick installation..."
    echo ""
    
    # Check system
    check_dependencies
    
    # Clone
    clone_repo
    
    # Install
    run_installer
    
    # Done
    print_success
}

# ── Cleanup on Error ────────────────────────────────────────────────────────
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Quick installation failed!"
        echo ""
        log_info "You can try manual installation:"
        echo "  git clone $REPO_URL"
        echo "  cd Infra-Sentinel"
        echo "  ./install.sh"
        echo ""
        log_info "For help, visit: https://github.com/ganeshak11/Infra-Sentinel/issues"
    fi
}

trap cleanup EXIT

# ── Run ─────────────────────────────────────────────────────────────────────
main
