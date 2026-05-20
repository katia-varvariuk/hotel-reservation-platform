@echo off
echo Starting ARIA Hotel...

echo [1/2] Starting backend (http://localhost:5151)...
start "Backend" cmd /c "cd /d C:\Web_API\HotelReservationSystem\HotelReservationSystem && dotnet run --launch-profile http"

echo [2/2] Starting frontend (http://localhost:3001)...
start "Frontend" cmd /c "cd /d C:\Web_API\hotel-frontend && npx next dev --port 3001"

echo.
echo Both services are starting in separate windows.
echo Backend:  http://localhost:5151/swagger
echo Frontend: http://localhost:3001
echo.

echo Waiting for backend to start...
:wait_loop
timeout /t 2 /nobreak > nul
curl -s http://localhost:5151/api/rooms > nul 2>&1
if errorlevel 1 goto wait_loop

echo Backend is ready!
start http://localhost:3001
