@echo off
cd /d "%~dp0"

:: 如果提供了第二个参数，则在该目录下查找所有.ts, .vue文件
:: 否则默认检查所有.ts, .vue文件
if "%~2"=="" (
    set LINT_PATH="**/*.{ts,vue}"
) else (
    set LINT_PATH="%~2/**/*.{ts,vue}"
)

if "%~1"=="" (
    echo %time% "npx --no-install eslint --quiet --cache %LINT_PATH% > eslint_output.log"
    npx --no-install eslint --quiet --cache %LINT_PATH% > eslint_output.log
) else (
    echo %time% "npx --no-install eslint --quiet --cache %LINT_PATH%"
    npx --no-install eslint --quiet --cache %LINT_PATH%
)
if %ERRORLEVEL% neq 0 (
    echo %time% "npx command failed with error level %ERRORLEVEL%"
)
echo %time% "eslint cache finished"