# Script de Despliegue Automático para IIS
# Aula Virtual Frontend

param(
    [Parameter(Mandatory=$false)]
    [string]$SiteName = "Aula Virtual",
    
    [Parameter(Mandatory=$false)]
    [string]$TargetPath = "C:\inetpub\wwwroot\aula-virtual",
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 80,
    
    [Parameter(Mandatory=$false)]
    [string]$HostName = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateSite = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false
)

# Colores para output
function Write-Step {
    param([string]$Message)
    Write-Host "`n✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  → $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "  ⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "  ✗ $Message" -ForegroundColor Red
}

# Banner
Write-Host @"
╔════════════════════════════════════════════════╗
║   Despliegue Aula Virtual - IIS               ║
║   Angular Frontend Deployment Script          ║
╚════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
$currentPath = Get-Location
Write-Info "Directorio actual: $currentPath"

if (-not (Test-Path "angular.json")) {
    Write-Error "No se encontró angular.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
}

# PASO 1: Build de producción
if (-not $SkipBuild) {
    Write-Step "Generando build de producción..."
    
    # Verificar que ng está disponible
    try {
        $ngVersion = ng version 2>&1 | Out-String
        Write-Info "Angular CLI encontrado"
    }
    catch {
        Write-Error "Angular CLI no está instalado o no está en el PATH"
        Write-Info "Instala con: npm install -g @angular/cli"
        exit 1
    }
    
    # Ejecutar build
    Write-Info "Ejecutando: ng build --configuration production"
    $buildResult = ng build --configuration production 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "El build falló. Revisa los errores arriba."
        Write-Host $buildResult
        exit 1
    }
    
    Write-Step "Build completado exitosamente"
} else {
    Write-Warning "Saltando build (usando archivos existentes)"
}

# Verificar que existe el directorio de build
$buildPath = Join-Path $currentPath "dist\aula-virtual\browser"
if (-not (Test-Path $buildPath)) {
    Write-Error "No se encontró el directorio de build: $buildPath"
    Write-Info "Ejecuta el script sin -SkipBuild para generar el build"
    exit 1
}

# PASO 2: Verificar/Crear directorio destino
Write-Step "Preparando directorio destino..."

if (-not (Test-Path $TargetPath)) {
    Write-Info "Creando directorio: $TargetPath"
    New-Item -Path $TargetPath -ItemType Directory -Force | Out-Null
} else {
    Write-Info "Directorio existe: $TargetPath"
    
    # Hacer backup si hay archivos
    if ((Get-ChildItem $TargetPath -File).Count -gt 0) {
        $backupPath = "$TargetPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Write-Info "Creando backup en: $backupPath"
        Copy-Item -Path $TargetPath -Destination $backupPath -Recurse -Force
    }
}

# PASO 3: Copiar archivos
Write-Step "Copiando archivos al servidor IIS..."

try {
    # Copiar contenido del build
    Write-Info "Copiando archivos desde: $buildPath"
    Copy-Item -Path "$buildPath\*" -Destination $TargetPath -Recurse -Force
    
    # Copiar web.config
    $webConfigSource = Join-Path $currentPath "web.config"
    if (Test-Path $webConfigSource) {
        Write-Info "Copiando web.config"
        Copy-Item -Path $webConfigSource -Destination $TargetPath -Force
    } else {
        Write-Warning "web.config no encontrado en el directorio raíz"
    }
    
    Write-Step "Archivos copiados exitosamente"
} catch {
    Write-Error "Error al copiar archivos: $_"
    exit 1
}

# PASO 4: Configurar permisos
Write-Step "Configurando permisos de IIS..."

try {
    # Dar permisos a IIS_IUSRS
    Write-Info "Asignando permisos a IIS_IUSRS"
    icacls $TargetPath /grant "IIS_IUSRS:(OI)(CI)RX" /T | Out-Null
    
    # Dar permisos al Application Pool (si existe)
    if ($CreateSite -eq $false) {
        Write-Info "Asignando permisos al Application Pool"
        icacls $TargetPath /grant "IIS APPPOOL\$SiteName:(OI)(CI)RX" /T 2>$null | Out-Null
    }
    
    Write-Step "Permisos configurados"
} catch {
    Write-Warning "No se pudieron configurar todos los permisos (requiere privilegios de administrador)"
}

# PASO 5: Configurar IIS
Write-Step "Configurando IIS..."

# Verificar que IIS está instalado y el módulo WebAdministration
try {
    Import-Module WebAdministration -ErrorAction Stop
} catch {
    Write-Error "Módulo WebAdministration no disponible. ¿Está IIS instalado?"
    Write-Info "Puedes instalar IIS desde 'Activar o desactivar las características de Windows'"
    exit 1
}

if ($CreateSite) {
    Write-Info "Creando nuevo sitio web en IIS..."
    
    # Verificar si el sitio ya existe
    $existingSite = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
    if ($existingSite) {
        Write-Warning "El sitio '$SiteName' ya existe. Será reconfigurado."
        Remove-Website -Name $SiteName
    }
    
    # Crear Application Pool
    Write-Info "Creando Application Pool: $SiteName"
    $appPool = New-WebAppPool -Name $SiteName -Force
    $appPool | Set-ItemProperty -Name "managedRuntimeVersion" -Value ""
    
    # Crear sitio
    Write-Info "Creando sitio web: $SiteName"
    $binding = "*:${Port}:"
    if ($HostName) {
        $binding = "*:${Port}:$HostName"
    }
    
    New-Website -Name $SiteName `
                -PhysicalPath $TargetPath `
                -ApplicationPool $SiteName `
                -Port $Port `
                -HostHeader $HostName `
                -Force | Out-Null
    
    Write-Step "Sitio creado exitosamente"
    Write-Info "URL: http://$(if($HostName){$HostName}else{'localhost'})$(if($Port -ne 80){":$Port"})"
    
} else {
    # Solo reiniciar el sitio existente
    $site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
    
    if ($site) {
        Write-Info "Reiniciando sitio: $SiteName"
        Stop-Website -Name $SiteName -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Start-Website -Name $SiteName
        
        # Reiniciar Application Pool
        $appPoolName = $site.applicationPool
        Write-Info "Reiniciando Application Pool: $appPoolName"
        Restart-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
        
        Write-Step "Sitio reiniciado"
    } else {
        Write-Warning "El sitio '$SiteName' no existe en IIS"
        Write-Info "Usa -CreateSite para crear el sitio automáticamente"
        Write-Info "O créalo manualmente en IIS Manager"
    }
}

# PASO 6: Verificaciones finales
Write-Step "Verificaciones finales..."

# Verificar archivos
$indexPath = Join-Path $TargetPath "index.html"
$webConfigPath = Join-Path $TargetPath "web.config"

if (Test-Path $indexPath) {
    Write-Info "✓ index.html encontrado"
} else {
    Write-Error "✗ index.html NO encontrado"
}

if (Test-Path $webConfigPath) {
    Write-Info "✓ web.config encontrado"
} else {
    Write-Warning "✗ web.config NO encontrado (puede causar problemas con rutas)"
}

# Verificar URL Rewrite Module
try {
    $urlRewrite = Get-WebConfiguration -Filter "/system.webServer/rewrite/rules/rule" -PSPath "IIS:\"
    Write-Info "✓ URL Rewrite Module parece estar disponible"
} catch {
    Write-Warning "✗ URL Rewrite Module podría no estar instalado"
    Write-Info "  Descarga desde: https://www.iis.net/downloads/microsoft/url-rewrite"
}

# Mostrar resumen
Write-Host @"

╔════════════════════════════════════════════════╗
║              DESPLIEGUE COMPLETADO             ║
╚════════════════════════════════════════════════╝

Detalles del Despliegue:
  • Sitio: $SiteName
  • Ruta: $TargetPath
  • Puerto: $Port
"@ -ForegroundColor Green

if ($HostName) {
    Write-Host "  • Host: $HostName" -ForegroundColor Green
    Write-Host "`nURL: http://$HostName$(if($Port -ne 80){":$Port"})" -ForegroundColor Cyan
} else {
    Write-Host "`nURL: http://localhost$(if($Port -ne 80){":$Port"})" -ForegroundColor Cyan
}

Write-Host @"

Próximos Pasos:
  1. Verifica que la URL de la API esté correctamente configurada
  2. Abre el sitio en un navegador
  3. Verifica la consola del navegador (F12) por errores
  4. Prueba el login y navegación

Para actualizar en el futuro, ejecuta:
  .\deploy-iis.ps1

"@ -ForegroundColor Yellow

Write-Host "✓ ¡Despliegue completado exitosamente!" -ForegroundColor Green
