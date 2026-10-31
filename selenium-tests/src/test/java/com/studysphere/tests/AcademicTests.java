package com.studysphere.tests;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Main user journey: subject, assignment, smart plan, focus timer, search and page smoke tests. */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Student journey")
class AcademicTests extends BaseTest {

    private final String subject = "Selenium Algorithms " + stamp;
    private final String assignment = "Selenium assignment " + stamp;

    private By assignmentCard(String xpathTail) {
        return By.xpath("//h3[normalize-space()='" + assignment + "']/ancestor::div[contains(@class,'card')][1]" + xpathTail);
    }

    @BeforeAll
    void login() throws Exception {
        loginViaApi();
    }

    @Test @Order(1) @DisplayName("Add a subject")
    void addSubject() {
        open("/subjects");
        click(By.xpath("//button[contains(normalize-space(.),'Add subject')]"));
        type(modalField("Subject name"), subject);
        type(modalField("Teacher"), "Dr. Selenium");
        click(modalButton("Add subject"));
        assertTrue(visible(heading(subject)).isDisplayed());
    }

    @Test @Order(2) @DisplayName("Add an assignment linked to the subject")
    void addAssignment() {
        open("/assignments");
        click(By.xpath("//button[contains(normalize-space(.),'Add assignment')]"));
        type(modalField("Title"), assignment);
        Select subjectSelect = new Select(visible(modalField("Subject")));
        wait.until(d -> subjectSelect.getOptions().stream().anyMatch(o -> o.getText().equals(subject)));
        subjectSelect.selectByVisibleText(subject);
        new Select(visible(modalField("Priority"))).selectByVisibleText("High");
        click(modalButton("Add assignment"));
        assertTrue(visible(heading(assignment)).isDisplayed());
        assertTrue(visible(assignmentCard("")).getText().toLowerCase().contains("high"), "Priority badge should read high");
    }

    @Test @Order(3) @DisplayName("Mark the assignment as completed")
    void completeAssignment() {
        open("/assignments");
        visible(heading(assignment));
        click(assignmentCard("//button[@aria-label='Mark complete']"));
        wait.until(d -> d.findElement(heading(assignment)).getAttribute("class").contains("line-through"));
        assertEquals("true", visible(assignmentCard("//button[@aria-label='Mark complete']")).getAttribute("aria-pressed"));
    }

    @Test @Order(4) @DisplayName("Delete the assignment")
    void deleteAssignment() {
        open("/assignments");
        visible(heading(assignment));
        click(assignmentCard("//button[@aria-label='Delete']"));
        wait.until(ExpectedConditions.alertIsPresent()).accept();
        wait.until(ExpectedConditions.invisibilityOfElementLocated(heading(assignment)));
        assertTrue(driver.findElements(heading(assignment)).isEmpty());
    }

    @Test @Order(5) @DisplayName("Smart planner generates study blocks")
    void smartPlanner() {
        open("/planner");
        click(By.id("generate-plan"));
        waitForText(By.xpath("//p[contains(@class,'text-ok')]"), "study blocks");
        assertTrue(visible(By.xpath("//span[normalize-space()='Smart plan']")).isDisplayed());
    }

    @Test @Order(6) @DisplayName("Focus timer starts, counts down and pauses")
    void focusTimer() {
        open("/focus");
        By display = By.id("timer-display");
        By toggle = By.id("timer-toggle");
        assertEquals("25:00", textOf(display));
        click(toggle);
        wait.until(d -> !d.findElement(display).getText().equals("25:00"));
        assertTrue(textOf(toggle).contains("Pause"));
        click(toggle);
        wait.until(ExpectedConditions.textToBePresentInElementLocated(toggle, "Resume"));
    }

    @Test @Order(7) @DisplayName("Global search finds the subject")
    void globalSearch() {
        open("/");
        WebElement box = visible(By.cssSelector("input[aria-label='Global search']"));
        box.sendKeys(subject, Keys.ENTER);
        wait.until(ExpectedConditions.urlContains("/search"));
        assertTrue(visible(By.xpath("//main//*[contains(text(),'" + subject + "')]")).isDisplayed());
    }

    @Test @Order(8) @DisplayName("AI assistant answers (offline mode without an API key)")
    void aiAssistant() {
        open("/assistant");
        type(By.id("ai-input"), "Normalization in databases");
        click(By.xpath("//button[contains(normalize-space(.),'Ask assistant')]"));
        WebElement answer = visible(By.xpath("//div[contains(@class,'whitespace-pre-wrap')]"));
        assertFalse(answer.getText().isBlank());
    }

    @ParameterizedTest(name = "{0} shows \"{1}\"") @Order(9) @DisplayName("Every page loads")
    @CsvSource(delimiter = '|', value = {
            "/|Selenium", "/subjects|Subjects", "/assignments|Assignments", "/exams|Examinations", "/syllabus|Syllabus tracker",
            "/preparation|Exam preparation", "/planner|Study planner", "/calendar|Academic calendar", "/focus|Focus mode",
            "/goals|Goals and streak", "/notes|Notes", "/analytics|Academic analytics", "/insights|Productivity insights",
            "/sessions|Session history", "/assistant|AI study assistant", "/settings|Profile and settings"})
    void pagesLoad(String path, String expectedHeading) {
        open(path);
        waitForText(By.tagName("h1"), expectedHeading);
    }
}
