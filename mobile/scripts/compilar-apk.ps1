param([ValidatePattern('^[E-Z]$')][string]$Unidad = 'R')
$ErrorActionPreference = 'Stop'
$mobile = Split-Path $PSScriptRoot -Parent
$repo = Split-Path $mobile -Parent
$raizCorta = $Unidad + ':\'
if (Test-Path -LiteralPath $raizCorta) { throw "La unidad $Unidad ya existe. Elige otra con -Unidad S." }
$javaAnterior = $env:JAVA_HOME
$sdkAnterior = $env:ANDROID_HOME
$gradleAnterior = $env:GRADLE_USER_HOME
$nodeAnterior = $env:NODE_ENV
$ubicacionAnterior = Get-Location
$aliasCreado = $false
try {
  # Alias temporal; no copia, mueve ni elimina archivos del proyecto.
  & subst ($Unidad + ':') $repo
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la ruta corta.' }
  $aliasCreado = $true
  $jdk = Get-ChildItem -LiteralPath (Join-Path $raizCorta '.herramientas/java') -Directory -ErrorAction SilentlyContinue | Where-Object Name -Like 'jdk-*' | Select-Object -First 1
  if ($jdk) { $env:JAVA_HOME = $jdk.FullName }
  $sdkLocal = Join-Path $raizCorta '.herramientas/sdk'
  if (Test-Path -LiteralPath $sdkLocal) { $env:ANDROID_HOME = $sdkLocal }
  if (!$env:JAVA_HOME -or !$env:ANDROID_HOME) { throw 'Configura JAVA_HOME y ANDROID_HOME o instala las herramientas locales del README.' }
  $env:GRADLE_USER_HOME = Join-Path $raizCorta '.herramientas/gradle'
  $env:NODE_ENV = 'production'
  Set-Location (Join-Path $raizCorta 'mobile')
  & npm.cmd run typecheck
  if ($LASTEXITCODE -ne 0) { throw 'TypeScript no pasó.' }
  & npm.cmd run test:coverage
  if ($LASTEXITCODE -ne 0) { throw 'Las pruebas no pasaron.' }
  & npx.cmd expo prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) { throw 'Falló la generación Android.' }
  Set-Location android
  & ./gradlew.bat :app:assembleRelease --no-daemon --console=plain --max-workers=4 '-Dorg.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=1024m'
  if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación. Revisa el log y la versión de Ninja indicada en el README.' }
  $salida = Join-Path $mobile 'artifacts'
  New-Item -ItemType Directory -Force -Path $salida | Out-Null
  $apk = Join-Path $salida 'refluye-campo-0.1.0-pruebas.apk'
  Copy-Item -LiteralPath './app/build/outputs/apk/release/app-release.apk' -Destination $apk -Force
  $hash = Get-FileHash -LiteralPath $apk -Algorithm SHA256
  ($hash.Hash + '  ' + (Split-Path $apk -Leaf)) | Set-Content -LiteralPath ($apk + '.sha256') -Encoding ascii
  Write-Output "APK interna: $apk"
} finally {
  Set-Location $ubicacionAnterior
  if ($aliasCreado) { & subst ($Unidad + ':') /D }
  $env:JAVA_HOME = $javaAnterior
  $env:ANDROID_HOME = $sdkAnterior
  $env:GRADLE_USER_HOME = $gradleAnterior
  $env:NODE_ENV = $nodeAnterior
}
