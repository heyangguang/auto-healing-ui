#!/bin/bash
# ============================================
# Pangolin Docker Image Build & Package Script
# ============================================
# Usage: ./build_docker.sh <version>
# Example: ./build_docker.sh v1.0.0
# ============================================

set -e

# ---- Configuration ----
REGISTRY="ghcr.io"
NAMESPACE="heyangguang"
IMAGE_NAME="auto-healing-ui"
PLATFORM="linux/amd64"
OUTPUT_DIR="docker-images"

# ---- Color Helpers ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ---- Validate Version ----
VERSION=$1

if [ -z "$VERSION" ]; then
    error "请提供版本号！\n  用法: ./build_docker.sh <version>\n  示例: ./build_docker.sh v1.0.0"
fi

if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    error "版本号格式不正确，请使用 vX.Y.Z 格式（如 v1.0.0）"
fi

FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}"
LATEST_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest"

# ---- Print Build Info ----
echo ""
echo "============================================"
echo "  Pangolin UI - Docker Build Script"
echo "============================================"
info "版本号:    ${VERSION}"
info "镜像名:    ${FULL_IMAGE}"
info "目标平台:  ${PLATFORM}"
info "输出目录:  ${OUTPUT_DIR}/"
echo "============================================"
echo ""

# ---- Create Output Directory ----
mkdir -p "${OUTPUT_DIR}"

# ---- Build Docker Image ----
info "开始构建 Docker 镜像..."
docker build \
    --platform "${PLATFORM}" \
    -t "${FULL_IMAGE}" \
    -t "${LATEST_IMAGE}" \
    .

ok "镜像构建完成: ${FULL_IMAGE}"

# ---- Export & Compress ----
TARBALL="${OUTPUT_DIR}/${IMAGE_NAME}-${VERSION}.tar.gz"

info "正在导出并压缩镜像..."
docker save "${FULL_IMAGE}" | gzip > "${TARBALL}"

FILESIZE=$(du -h "${TARBALL}" | cut -f1)
ok "镜像已保存: ${TARBALL} (${FILESIZE})"

# ---- Summary ----
echo ""
echo "============================================"
echo -e "  ${GREEN}✅ 构建完成！${NC}"
echo "============================================"
echo ""
echo "  产出文件:"
echo "    ${TARBALL}"
echo ""
echo "  部署到服务器:"
echo "    1. 上传文件到目标服务器"
echo "    2. 加载镜像:"
echo "       gunzip -c ${IMAGE_NAME}-${VERSION}.tar.gz | docker load"
echo "    3. 启动服务:"
echo "       docker compose up -d"
echo ""
echo "============================================"
