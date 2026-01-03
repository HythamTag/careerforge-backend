@echo off
REM =========================================================
REM DATABASE RESET SCRIPT
REM Deletes all data from MongoDB collections
REM =========================================================

echo.
echo ========================================
echo   DATABASE RESET UTILITY
echo ========================================
echo.
echo WARNING: This will DELETE ALL DATA from the database!
echo.
set /p CONFIRM="Are you sure you want to continue? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo.
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Connecting to MongoDB...
echo.

REM Use mongoose which is already installed in backend
cd backend
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://127.0.0.1:27017/cv_enhancer').then(() => mongoose.connection.dropDatabase()).then(() => { console.log('SUCCESS: Database dropped successfully'); process.exit(0); }).catch(err => { console.error('ERROR:', err.message); process.exit(1); });"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   DATABASE RESET SUCCESSFUL
    echo ========================================
    echo.
    echo All collections have been deleted.
    echo The database will be recreated automatically when the app starts.
    echo.
) else (
    echo.
    echo ========================================
    echo   DATABASE RESET FAILED
    echo ========================================
    echo.
    echo Error: Could not connect to MongoDB or drop database.
    echo.
    echo Troubleshooting:
    echo 1. Make sure MongoDB is running (check services)
    echo 2. Verify MongoDB is listening on 127.0.0.1:27017
    echo 3. Check if the database name is correct
    echo.
)

cd ..
pause
