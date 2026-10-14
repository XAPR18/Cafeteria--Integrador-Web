$ErrorActionPreference = 'Stop'

function LeerSecreto([string]$Mensaje) {
    $secreto = Read-Host $Mensaje -AsSecureString
    $puntero = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secreto)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($puntero) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($puntero) }
}

$variables = @('SPRING_PROFILES_ACTIVE', 'DB_URL', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'JAVA_HOME')
$anteriores = @{}
foreach ($nombre in $variables) {
    $anteriores[$nombre] = [Environment]::GetEnvironmentVariable($nombre, 'Process')
}

Push-Location $PSScriptRoot
try {
    if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) {
        throw 'El puerto 8080 esta ocupado. Deten el servidor anterior con Ctrl+C antes de iniciar Supabase.'
    }

    $env:SPRING_PROFILES_ACTIVE = 'supabase'
    $env:DB_URL = 'jdbc:postgresql://aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require'
    $env:DB_USER = 'postgres.hnavlkmulzvxdesgcmrj'
    $env:DB_PASSWORD = LeerSecreto 'Contrasena de la base de datos Supabase'
    if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) { throw 'La contrasena de la base de datos es obligatoria.' }

    if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET)) {
        $bytes = New-Object byte[] 48
        $generador = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $generador.GetBytes($bytes) } finally { $generador.Dispose() }
        $env:JWT_SECRET = [Convert]::ToBase64String($bytes)
        Write-Host 'Se genero una clave JWT temporal: las sesiones anteriores se invalidan al reiniciar con otra clave.'
    }

    if ([string]::IsNullOrWhiteSpace($env:ADMIN_EMAIL)) {
        $env:ADMIN_EMAIL = Read-Host 'Correo del administrador inicial'
    }
    if ([string]::IsNullOrWhiteSpace($env:ADMIN_PASSWORD)) {
        $env:ADMIN_PASSWORD = LeerSecreto 'Contrasena del administrador inicial (minimo 12 caracteres)'
    }
    if ($env:ADMIN_EMAIL -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') { throw 'Introduce un correo valido.' }
    if ($env:ADMIN_PASSWORD.Length -lt 12 -or [Text.Encoding]::UTF8.GetByteCount($env:ADMIN_PASSWORD) -gt 72) {
        throw 'La contrasena administrativa debe tener al menos 12 caracteres y no superar 72 bytes.'
    }

    if (Test-Path -LiteralPath 'C:\Program Files\Java\jdk-21.0.12\bin\java.exe') {
        $env:JAVA_HOME = 'C:\Program Files\Java\jdk-21.0.12'
    }
    Write-Host 'Iniciando Spring Boot con PostgreSQL/Supabase. Las migraciones crearan el esquema cafe.'
    Write-Host 'El administrador inicial se crea solo si todavia no existen cuentas.'
    & .\mvnw.cmd spring-boot:run
    if ($LASTEXITCODE -ne 0) { throw 'El servidor no pudo iniciarse. Revisa el error de conexion mostrado arriba.' }
}
finally {
    foreach ($nombre in $variables) {
        [Environment]::SetEnvironmentVariable($nombre, $anteriores[$nombre], 'Process')
    }
    Pop-Location
}
