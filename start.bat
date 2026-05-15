@echo off
echo Starting ARIA Hotel...

echo [1/2] Starting backend (http://localhost:5151)...
start "Backend" cmd /c "cd /d C:\Web_API\HotelReservationSystem\HotelReservationSystem && dotnet run --launch-profile http"

echo [2/2] Starting frontend (http://localhost:3000)...
start "Frontend" cmd /c "cd /d C:\Web_API\hotel-frontend && npm run dev"

echo.
echo Both services are starting in separate windows.
echo Backend:  http://localhost:5151/swagger
echo Frontend: http://localhost:3000
echo.

timeout /t 15 /nobreak > nul
start http://localhost:3000
