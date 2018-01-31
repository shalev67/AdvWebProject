
@echo *** Start node server ***
start cmd /k node app\runner.js

timeout 5
start chrome.exe "http://localhost:5000"

@PAUSE 