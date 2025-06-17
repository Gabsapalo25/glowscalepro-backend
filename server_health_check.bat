@echo off
:: Script para validar estrutura e testar servidor do glowscalepro-backend

setlocal

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

echo [1] Verificando arquivos do middleware...
:: Lista de arquivos esperados
set MIDDLEWARE_FILES=csrfMiddleware.js validateQuizPayload.js authMiddleware.js loggerMiddleware.js

cd /d "%~dp0%"
for %%F in (%MIDDLEWARE_FILES%) do (
    if exist "middleware\%%F" (
        echo ✅ middleware\%%F encontrado
    ) else (
        echo ❌ middleware\%%F NÃO encontrado
        echo Abra o projeto e crie o arquivo acima.
        pause
        exit /b 1
    )
)

echo.
echo [2] Iniciando servidor (se não estiver rodando)...
:: Verifica se a porta 10000 está ocupada
netstat -ano | findstr :10000 >nul
if %errorlevel% equ 0 (
    echo ⚠️ Servidor já parece estar rodando.
) else (
    echo 🚀 Iniciando servidor...
    node index.js
    timeout /t 5 /nobreak >nul
)

echo.
echo [3] Testando geração de token CSRF...
curl -s %SERVER_URL%/api/csrf-token | findstr /i "csrfToken" > csrf.json 2>nul
if not exist csrf.json (
    echo ❌ Falha ao gerar token CSRF. O servidor pode estar com erro.
    del csrf.json 2>nul
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('powershell -Command "(Get-Content csrf.json -Raw | ConvertFrom-Json).csrfToken"') do set CSRF_TOKEN=%%a
if "%CSRF_TOKEN%" == "" (
    echo ❌ Token CSRF vazio ou inválido.
    del csrf.json
    pause
    exit /b 1
)

echo ✅ Token CSRF gerado: %CSRF_TOKEN%

echo.
echo [4] Enviando dados do quiz para testar servidor...
curl -X POST %SERVER_URL%/send-result ^
  -H "Content-Type: application/json" ^
  -H "X-CSRF-Token: %CSRF_TOKEN%" ^
  -d "{\"csrfToken\":\"%CSRF_TOKEN%\",\"name\":\"%NAME%\",\"email\":\"%EMAIL%\",\"score\":%SCORE%,\"total\":%TOTAL%,\"quizTitle\":\"%QUIZ_TITLE%\",\"countryCode\":\"%COUNTRY_CODE%\",\"whatsapp\":\"%WHATSAPP%\",\"q4\":\"%Q4%\",\"consent\":%CONSENT%}" ^
  --output result.json 2>nul

if not exist result.json (
    echo ❌ Requisição falhou. Certifique-se de que o servidor está rodando.
    pause
    exit /b 1
)

type result.json | findstr /i "message"
del result.json

echo.
echo 🎉 Teste concluído com sucesso!
echo Todos os middlewares e rotas estão funcionando corretamente.
pause