# StudySphere Selenium tests (Java, JUnit 5)

End-to-end UI tests for the Dockerized StudySphere app. They open a real Chrome browser, create a fresh student for every run, and exercise the main journeys.

| Suite | What it checks |
|---|---|
| AuthTests | register, logout, protected-page redirect, validation message, wrong password, valid login |
| AcademicTests | add subject, add / complete / delete assignment, smart planner, focus timer, global search, AI assistant, and every page loads |

## Prerequisites
Java 17+, Maven, Google Chrome, and the app running: `docker compose up -d` from the project root.

## Run
```bash
cd selenium-tests
mvn test                          # visible Chrome against http://localhost:3000
mvn test -DslowMs=700             # slowed down, good for a live demo
mvn test -Dheadless=true          # no browser window (used by Jenkins)
mvn test -Dtest=AuthTests         # one suite only
```
Options: `-DbaseUrl=http://localhost:3000`, `-DapiUrl=http://localhost:8081/api` (the gateway port).

## Results
- HTML report: `target/report/index.html` (failed tests include a screenshot)
- JUnit XML for Jenkins: `target/surefire-reports/*.xml`
