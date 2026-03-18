#!/bin/bash

################################################################################
# Script de Deploy Automatizado - Prosperus Club PWA
#
# O QUE FAZ:
# 1. Incrementa versão automaticamente em todos os arquivos
# 2. Faz build do projeto
# 3. Envia para o VPS
# 4. Valida se o deploy foi bem-sucedido
#
# COMO USAR:
# chmod +x deploy.sh
# ./deploy.sh
#
# CONFIGURAÇÃO:
# - Edite as variáveis VPS_USER, VPS_HOST e VPS_PATH abaixo
#
# @version 1.0.0
################################################################################

set -e  # Para em caso de erro

# ============================================================================
# CONFIGURAÇÕES - EDITE AQUI
# ============================================================================

VPS_USER="seu-usuario"                           # ← Seu usuário SSH
VPS_HOST="seu-vps.com"                           # ← IP ou domínio do VPS
VPS_PATH="/var/www/prosperus-club"               # ← Caminho no VPS
BUILD_DIR="dist"                                  # ← Pasta de build (Vite)

# ============================================================================
# CORES PARA OUTPUT
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# VERIFICAÇÕES INICIAIS
# ============================================================================

print_header "🔍 VERIFICAÇÕES INICIAIS"

# Verifica se está na raiz do projeto
if [ ! -f "package.json" ]; then
    print_error "package.json não encontrado!"
    print_info "Execute este script da raiz do projeto"
    exit 1
fi

print_success "package.json encontrado"

# Verifica se tem alterações não commitadas (opcional)
if [ -d ".git" ]; then
    if [[ -n $(git status -s) ]]; then
        print_warning "Você tem alterações não commitadas"
        read -p "Continuar mesmo assim? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Deploy cancelado"
            exit 0
        fi
    else
        print_success "Git limpo"
    fi
fi

# ============================================================================
# INCREMENTA VERSÃO
# ============================================================================

print_header "📝 INCREMENTANDO VERSÃO"

# Lê versão atual do package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_info "Versão atual: $CURRENT_VERSION"

# Incrementa última parte (2.9.0 → 2.9.1)
NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g')
print_info "Nova versão: $NEW_VERSION"

# Confirmação
read -p "Confirma incremento para v$NEW_VERSION? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deploy cancelado"
    exit 0
fi

# Atualiza package.json
print_info "Atualizando package.json..."
npm version $NEW_VERSION --no-git-tag-version
print_success "package.json atualizado"

# Atualiza AutoUpdateManager.tsx se existir
if [ -f "src/components/AutoUpdateManager.tsx" ]; then
    print_info "Atualizando AutoUpdateManager.tsx..."
    sed -i.bak "s/const APP_VERSION = '[^']*'/const APP_VERSION = '$NEW_VERSION'/" src/components/AutoUpdateManager.tsx
    rm -f src/components/AutoUpdateManager.tsx.bak
    print_success "AutoUpdateManager.tsx atualizado"
fi

# Atualiza Service Worker se existir
if [ -f "public/sw.js" ]; then
    print_info "Atualizando Service Worker..."
    sed -i.bak "s/CACHE_VERSION = '[^']*'/CACHE_VERSION = 'v$NEW_VERSION'/" public/sw.js
    rm -f public/sw.js.bak
    print_success "Service Worker atualizado"
fi

# Atualiza manifest.json se existir
if [ -f "public/manifest.json" ]; then
    print_info "Atualizando manifest.json..."
    # Usando node para atualizar JSON corretamente
    node -e "
        const fs = require('fs');
        const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
        manifest.version = '$NEW_VERSION';
        fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
    "
    print_success "manifest.json atualizado"
fi

# ============================================================================
# LIMPEZA
# ============================================================================

print_header "🧹 LIMPANDO BUILDS ANTERIORES"

if [ -d "$BUILD_DIR" ]; then
    print_info "Removendo pasta $BUILD_DIR..."
    rm -rf $BUILD_DIR
    print_success "Build anterior removido"
fi

if [ -d "node_modules/.vite" ]; then
    print_info "Limpando cache do Vite..."
    rm -rf node_modules/.vite
    print_success "Cache limpo"
fi

# ============================================================================
# BUILD
# ============================================================================

print_header "📦 BUILDANDO PROJETO"

print_info "Executando: npm run build"
npm run build

if [ $? -eq 0 ]; then
    print_success "Build concluído com sucesso!"
else
    print_error "Erro no build!"
    exit 1
fi

# Verifica se pasta dist foi criada
if [ ! -d "$BUILD_DIR" ]; then
    print_error "Pasta $BUILD_DIR não foi criada!"
    exit 1
fi

print_success "Pasta $BUILD_DIR criada"

# Mostra tamanho do build
BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)
print_info "Tamanho do build: $BUILD_SIZE"

# ============================================================================
# DEPLOY PARA VPS
# ============================================================================

print_header "🚀 ENVIANDO PARA VPS"

print_info "Destino: $VPS_USER@$VPS_HOST:$VPS_PATH"

# Verifica se tem acesso SSH
print_info "Testando conexão SSH..."
if ssh -o BatchMode=yes -o ConnectTimeout=5 $VPS_USER@$VPS_HOST exit 2>/dev/null; then
    print_success "Conexão SSH OK"
else
    print_error "Não foi possível conectar ao VPS!"
    print_info "Verifique:"
    print_info "  - Usuário: $VPS_USER"
    print_info "  - Host: $VPS_HOST"
    print_info "  - Chave SSH configurada"
    exit 1
fi

# Faz backup do deploy anterior no VPS
print_info "Criando backup do deploy anterior..."
ssh $VPS_USER@$VPS_HOST "
    if [ -d $VPS_PATH ]; then
        cp -r $VPS_PATH ${VPS_PATH}_backup_$(date +%Y%m%d_%H%M%S)
        echo 'Backup criado'
    fi
"

# Envia arquivos via rsync
print_info "Enviando arquivos..."
rsync -avz --delete \
    --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env.local' \
    --exclude '*.log' \
    $BUILD_DIR/ $VPS_USER@$VPS_HOST:$VPS_PATH/

if [ $? -eq 0 ]; then
    print_success "Arquivos enviados com sucesso!"
else
    print_error "Erro ao enviar arquivos!"
    exit 1
fi

# ============================================================================
# VALIDAÇÃO
# ============================================================================

print_header "✅ VALIDANDO DEPLOY"

# Verifica se index.html existe no VPS
print_info "Verificando arquivos no VPS..."
ssh $VPS_USER@$VPS_HOST "
    if [ -f $VPS_PATH/index.html ]; then
        echo 'index.html encontrado'
        exit 0
    else
        echo 'index.html NÃO encontrado!'
        exit 1
    fi
"

if [ $? -eq 0 ]; then
    print_success "Arquivos validados no VPS"
else
    print_error "Validação falhou!"
    exit 1
fi

# ============================================================================
# RESUMO FINAL
# ============================================================================

print_header "📊 RESUMO DO DEPLOY"

echo ""
echo "┌─────────────────────────────────────┐"
echo "│  DEPLOY CONCLUÍDO COM SUCESSO! ✅   │"
echo "└─────────────────────────────────────┘"
echo ""
echo "Versão anterior:  $CURRENT_VERSION"
echo "Versão nova:      $NEW_VERSION"
echo "Build size:       $BUILD_SIZE"
echo "Destino:          $VPS_USER@$VPS_HOST:$VPS_PATH"
echo "Data/Hora:        $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ============================================================================
# INSTRUÇÕES PARA USUÁRIOS
# ============================================================================

print_header "📱 PRÓXIMOS PASSOS"

echo ""
echo "1. PARA VOCÊ (TESTE IMEDIATO):"
echo "   • Acesse o app pelo iPhone"
echo "   • Delete o app da tela inicial"
echo "   • Reinstale via Safari → Compartilhar → Adicionar à Tela Inicial"
echo ""
echo "2. PARA OS USUÁRIOS:"
echo "   a) Se você implementou o AutoUpdateManager:"
echo "      • Os usuários verão notificação automática ao abrir o app"
echo "      • Atualização será feita automaticamente em 5 segundos"
echo ""
echo "   b) Se NÃO implementou AutoUpdateManager ainda:"
echo "      • Envie comunicado pedindo para:"
echo "        1. Deletar o app"
echo "        2. Reinstalar via Safari"
echo ""
echo "3. MONITORAMENTO:"
echo "   • Verifique logs do VPS se necessário"
echo "   • Teste todas as funcionalidades críticas"
echo "   • Monitore feedback dos usuários"
echo ""

# ============================================================================
# GIT COMMIT (OPCIONAL)
# ============================================================================

if [ -d ".git" ]; then
    echo ""
    read -p "Deseja fazer commit das alterações de versão? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add package.json package-lock.json
        [ -f "src/components/AutoUpdateManager.tsx" ] && git add src/components/AutoUpdateManager.tsx
        [ -f "public/sw.js" ] && git add public/sw.js
        [ -f "public/manifest.json" ] && git add public/manifest.json
        
        git commit -m "chore: bump version to $NEW_VERSION"
        git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"
        
        print_success "Commit criado com tag v$NEW_VERSION"
        
        read -p "Push para repositório remoto? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            git push origin --tags
            print_success "Pushed para repositório"
        fi
    fi
fi

# ============================================================================
# FIM
# ============================================================================

echo ""
print_success "Deploy finalizado!"
echo ""

# Abre URL do app (opcional - ajuste conforme necessário)
# open "https://seu-dominio.com"
