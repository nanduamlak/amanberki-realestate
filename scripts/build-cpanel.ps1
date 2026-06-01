# build-cpanel.ps1
# This script compiles, packages, and zips your Next.js application for cPanel deployment.

Write-Host "1. Cleaning previous builds..." -ForegroundColor Cyan
if (Test-Path -Path "deploy_dist") { Remove-Item -Recurse -Force "deploy_dist" }
if (Test-Path -Path "deploy.zip") { Remove-Item -Force "deploy.zip" }

Write-Host "2. Running Next.js build..." -ForegroundColor Cyan
$env:NEXT_PUBLIC_APP_URL="https://realestate.amanberkigroup.com"
$env:NODE_ENV="production"
# Injecting a dummy database URL to satisfy the compilation-time checks in lib/db.ts
$env:DATABASE_URL="postgresql://dummy_user:dummy_password@127.0.0.1:5432/dummy_db"
npm run build

Write-Host "3. Creating deployment directory structure..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "deploy_dist" | Out-Null
New-Item -ItemType Directory -Path "deploy_dist\.next" | Out-Null
New-Item -ItemType Directory -Path "deploy_dist\tmp" | Out-Null

Write-Host "4. Copying compiled standalone files..." -ForegroundColor Cyan
Copy-Item -Recurse -Force -Path ".next\standalone\*" -Destination "deploy_dist\"
Copy-Item -Recurse -Force -Path ".next\standalone\.*" -Destination "deploy_dist\" -ErrorAction SilentlyContinue

Write-Host "5. Copying static resources and scripts..." -ForegroundColor Cyan
Copy-Item -Recurse -Force -Path "public" -Destination "deploy_dist\public"
Copy-Item -Recurse -Force -Path ".next\static" -Destination "deploy_dist\.next\static"
Copy-Item -Recurse -Force -Path "scripts" -Destination "deploy_dist\scripts"
Copy-Item -Force -Path "package.json" -Destination "deploy_dist\package.json"

Write-Host "6. Creating Passenger restart file..." -ForegroundColor Cyan
New-Item -ItemType File -Path "deploy_dist\tmp\restart.txt" | Out-Null

Write-Host "7. Compressing into deploy.zip..." -ForegroundColor Cyan
Compress-Archive -Path "deploy_dist\*" -DestinationPath "deploy.zip" -Force

Write-Host "8. Cleaning up build folder..." -ForegroundColor Cyan
Remove-Item -Recurse -Force "deploy_dist"

Write-Host "🎉 SUCCESS! Your 'deploy.zip' is ready." -ForegroundColor Green
Write-Host "Now simply upload 'deploy.zip' to cPanel via File Manager and click 'Extract'!" -ForegroundColor Yellow
