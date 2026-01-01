@echo off
REM ========================================
REM CLEAN DATABASE
REM ========================================

title CV Enhancer - Clean Database

echo.
echo ========================================
echo   CV ENHANCER - CLEAN DATABASE
echo ========================================
echo.
echo WARNING: This will DELETE ALL data from the database!
echo.
echo This will remove:
echo   - All CVs
echo   - All parsing jobs
echo   - All generation jobs
echo   - All CV versions
echo   - All ATS analysis results
echo.
set /p confirm="Are you sure you want to continue? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo.
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo Cleaning database...
echo.

REM Run the MongoDB cleanup
echo Dropping all collections...
docker exec cv-enhancer-mongodb mongosh --quiet cv-enhancer --eval "print('Dropping all collections...');db.cvs.drop();db.jobs.drop();db.generations.drop();db.cvversions.drop();db.cvatsanalyses.drop();db.cvatsresults.drop();print('Database cleaned successfully!');"

if %errorlevel% neq 0 (
    echo.
    echo Docker connection failed, trying local MongoDB connection...
    mongosh --quiet cv-enhancer --eval "print('Dropping all collections...');db.cvs.drop();db.jobs.drop();db.generations.drop();db.cvversions.drop();db.cvatsanalyses.drop();db.cvatsresults.drop();print('Database cleaned successfully!');"
)

if %errorlevel% neq 0 (
    echo.
    echo X Failed to clean database!
    echo Please ensure MongoDB is running.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   DATABASE CLEANUP COMPLETE!
echo ========================================
echo.
echo Note: You may also want to clean up uploaded files:
echo   Delete contents of: backend\uploads\
echo.
pause
