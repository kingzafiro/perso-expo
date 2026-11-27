#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

MODE="simulator"
CLEAN_PREBUILD=false
NO_BUILD_CACHE=false

print_help() {
  cat <<'EOF'
Perso - Local iOS Builder (Expo SDK 58 + Xcode)

Uso:
  bash ./scripts/build-ios-local.sh [opción]

Modos:
  --simulator     Compila y abre el Development Build en el Simulador de iOS (por defecto)
  --device        Compila e instala en un iPhone físico conectado por USB/Wi-Fi
  --release       Compila en modo Release (sin depender de Metro)
  --prebuild      Regenera la carpeta ios/ e instala CocoaPods sin compilar
  --xcode         Asegura ios/ + Pods y abre ios/perso.xcworkspace en Xcode
  --eas-sim       Genera un build local de EAS para Simulador (profile: development-simulator)
  --eas-dev       Genera un build local de EAS para dispositivo físico (profile: development)

Flags adicionales:
  --clean         Fuerza `npx expo prebuild --platform ios --clean` antes de compilar
  --no-cache      Agrega `--no-build-cache` a `expo run:ios`
  -h, --help      Muestra esta ayuda
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --simulator) MODE="simulator" ;;
    --device) MODE="device" ;;
    --release) MODE="release" ;;
    --prebuild) MODE="prebuild" ;;
    --xcode) MODE="xcode" ;;
    --eas-sim) MODE="eas-sim" ;;
    --eas-dev) MODE="eas-dev" ;;
    --clean) CLEAN_PREBUILD=true ;;
    --no-cache) NO_BUILD_CACHE=true ;;
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      echo "Opción desconocida: $1"
      print_help
      exit 1
      ;;
  esac
  shift
done

echo "==> [1/4] Verificando Xcode..."
XCODE_DEV_DIR="/Applications/Xcode.app/Contents/Developer"
if [[ ! -d "$XCODE_DEV_DIR" ]]; then
  echo "Error: No se encontró Xcode en /Applications/Xcode.app."
  echo "Instala Xcode desde la App Store y ábrelo una vez para aceptar la licencia."
  exit 1
fi

CURRENT_DEV_DIR="$(xcode-select -p 2>/dev/null || true)"
if [[ "$CURRENT_DEV_DIR" != "$XCODE_DEV_DIR" ]]; then
  echo "Aviso: xcode-select apunta a '${CURRENT_DEV_DIR:-ninguno}'."
  echo "Usando DEVELOPER_DIR=$XCODE_DEV_DIR para esta ejecución."
  echo "Para fijarlo permanentemente ejecuta:"
  echo "  sudo xcode-select -s $XCODE_DEV_DIR"
  export DEVELOPER_DIR="$XCODE_DEV_DIR"
fi

xcodebuild -version

echo "==> [2/4] Verificando CocoaPods..."
if ! command -v pod >/dev/null 2>&1; then
  echo "Error: CocoaPods ('pod') no está instalado."
  if command -v brew >/dev/null 2>&1; then
    echo "Instálalo con:"
    echo "  brew install cocoapods"
  else
    echo "Instálalo con Homebrew (brew install cocoapods) o RubyGems (sudo gem install cocoapods)."
  fi
  exit 1
fi
echo "CocoaPods $(pod --version)"

ensure_ios_project() {
  if [[ "$CLEAN_PREBUILD" == true ]] || [[ ! -d "$PROJECT_ROOT/ios" ]]; then
    echo "==> [3/4] Ejecutando Expo Prebuild para iOS..."
    if [[ "$CLEAN_PREBUILD" == true ]]; then
      npx expo prebuild --platform ios --clean --no-install
    else
      npx expo prebuild --platform ios --no-install
    fi
  else
    echo "==> [3/4] Carpeta ios/ ya existe (usa --clean para regenerarla)."
  fi
}

install_pods_if_needed() {
  if [[ ! -f "$PROJECT_ROOT/ios/Podfile.lock" ]] || [[ "$CLEAN_PREBUILD" == true ]]; then
    echo "==> Instalando CocoaPods..."
    (cd "$PROJECT_ROOT/ios" && pod install)
  fi
}

find_ios_simulator_udid() {
  local booted
  booted="$(xcrun simctl list devices booted 2>/dev/null | grep -E "iPhone .*\([A-F0-9-]{36}\)" | head -n 1 | sed -E 's/.*\(([A-F0-9-]{36})\).*/\1/' || true)"
  if [[ -n "$booted" ]]; then
    echo "$booted"
    return 0
  fi

  local available
  available="$(xcrun simctl list devices available 2>/dev/null | grep -E "iPhone .*\([A-F0-9-]{36}\)" | head -n 1 | sed -E 's/.*\(([A-F0-9-]{36})\).*/\1/' || true)"
  if [[ -n "$available" ]]; then
    echo "$available"
    return 0
  fi

  return 1
}

has_codesigning_identity() {
  security find-identity -v -p codesigning 2>/dev/null | grep -Eq "Apple Development|iPhone Developer"
}

run_simulator_build() {
  local configuration="$1"
  local sim_udid
  sim_udid="$(find_ios_simulator_udid || true)"
  if [[ -z "$sim_udid" ]]; then
    echo ""
    echo "Error: No hay ningún Simulador de iPhone disponible en Xcode."
    echo "Descarga el simulador de iOS ejecutando:"
    echo "  xcodebuild -downloadPlatform iOS"
    echo "O desde Xcode: Settings (⌘,) -> Components -> iOS -> Get."
    exit 1
  fi

  if has_codesigning_identity; then
    echo "==> [4/4] Compilando ($configuration) y ejecutando en Simulador ($sim_udid)..."
    npx expo run:ios --configuration "$configuration" --device "$sim_udid" ${RUN_IOS_FLAGS[@]+"${RUN_IOS_FLAGS[@]}"}
    return 0
  fi

  local out_dir="$PROJECT_ROOT/.expo/local-ios-build/$configuration"
  rm -rf "$out_dir"
  mkdir -p "$out_dir"

  echo "==> [4/4] Sin certificado Apple Development local (requerido por Apple Sign In en simulador)."
  echo "    Compilando binario genérico de Simulador ($configuration) sin firma y lanzándolo en $sim_udid..."
  npx expo run:ios --configuration "$configuration" --device generic --output "$out_dir" --no-bundler ${RUN_IOS_FLAGS[@]+"${RUN_IOS_FLAGS[@]}"}

  local app_path
  app_path="$(find "$out_dir" -maxdepth 2 -name '*.app' | head -n 1)"
  if [[ -z "$app_path" ]]; then
    echo "Error: No se generó el archivo .app en $out_dir"
    exit 1
  fi

  echo "==> Instalando y abriendo $app_path en Simulador ($sim_udid)..."
  npx expo run:ios --configuration "$configuration" --device "$sim_udid" --binary "$app_path"
}

RUN_IOS_FLAGS=()
if [[ "$NO_BUILD_CACHE" == true ]]; then
  RUN_IOS_FLAGS+=(--no-build-cache)
fi

case "$MODE" in
  prebuild)
    CLEAN_PREBUILD=true
    ensure_ios_project
    install_pods_if_needed
    echo "==> [4/4] Proyecto nativo iOS listo en $PROJECT_ROOT/ios"
    ;;
  xcode)
    ensure_ios_project
    install_pods_if_needed
    WORKSPACE="$(find "$PROJECT_ROOT/ios" -maxdepth 1 -name '*.xcworkspace' | head -n 1)"
    if [[ -z "$WORKSPACE" ]]; then
      echo "Error: No se encontró archivo .xcworkspace en $PROJECT_ROOT/ios"
      exit 1
    fi
    echo "==> [4/4] Abriendo $WORKSPACE en Xcode..."
    open "$WORKSPACE"
    ;;
  simulator)
    ensure_ios_project
    install_pods_if_needed
    run_simulator_build "Debug"
    ;;
  device)
    ensure_ios_project
    install_pods_if_needed
    echo "==> [4/4] Compilando e instalando en iPhone físico..."
    npx expo run:ios --device ${RUN_IOS_FLAGS[@]+"${RUN_IOS_FLAGS[@]}"}
    ;;
  release)
    ensure_ios_project
    install_pods_if_needed
    run_simulator_build "Release"
    ;;
  eas-sim)
    echo "==> [3/4] Ejecutando EAS Local Build (profile: development-simulator)..."
    npx eas-cli build --platform ios --profile development-simulator --local
    ;;
  eas-dev)
    echo "==> [3/4] Ejecutando EAS Local Build (profile: development)..."
    npx eas-cli build --platform ios --profile development --local
    ;;
esac
