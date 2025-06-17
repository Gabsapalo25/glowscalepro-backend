@echo off
:: Script para testar o servidor glowscalepro-backend via curl no Windows
:: Desenvolvido para evitar erros de token CSRF e validação de campos

setlocal enabledelayedexpansion

:: Definições
set SERVER_URL=http://localhost:10000
set QUIZ_TITLE=NervoVive Quiz
set NAME=Test User
set EMAIL=test@example.com
set SCORE=9
set TOTAL=12
set COUNTRY_CODE=+1
set WHATSAPP=123456789
set Q4=yes
set CONSENT=true

echo [1] Gerando token CSRF...
curl -s %SERVER_URL%/api/csrf-token | findstr /i "csrfToken" > csrf.json
if not exist csrf.json (
    echo ❌ Falha ao gerar token CSRF. Verifique se o servidor está rodando.
    exit /b 1
)

:: Extrair token com PowerShell (Windows nativo)
for /f "tokens=*" %%a in ('powershell -Command "(Get-Content csrf.json -Raw | ConvertFrom-Json).csrfToken"') do set CSRF_TOKEN=%%a
if "%CSRF_TOKEN%" == "" (
    echo ❌ Token CSRF vazio ou inválido.
    del csrf.json
    exit /b 1
)

echo ✅ Token CSRF gerado: %CSRF_TOKEN%

echo [2] Enviando dados do quiz...
curl -X POST %SERVER_URL%/send-result ^
  -H "Content-Type: application/json" ^
  -H "X-CSRF-Token: %CSRF_TOKEN%" ^
  -d "{\"csrfToken\":\"%CSRF_TOKEN%\",\"name\":\"%NAME%\",\"email\":\"%EMAIL%\",\"score\":%SCORE%,\"total\":%TOTAL%,\"quizTitle\":\"%QUIZ_TITLE%\",\"countryCode\":\"%COUNTRY_CODE%\",\"whatsapp\":\"%WHATSAPP%\",\"q4\":\"%Q4%\",\"consent\":%CONSENT%}" ^
  --output result.json

if exist result.json (
    echo 📋 Resposta do servidor:
    type result.json
    del result.json
) else (
    echo ❌ Falha na requisição. Verifique o servidor ou o token.
)

echo [3] Limpando token temporário...
del csrf.json

echo ✅ Teste concluído!
pause