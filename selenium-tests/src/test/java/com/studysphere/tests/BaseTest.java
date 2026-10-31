package com.studysphere.tests;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/** Shared browser setup and small helpers used by every test class. */
@ExtendWith(ScreenshotOnFailure.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class BaseTest {

    protected WebDriver driver;
    protected WebDriverWait wait;

    protected static final String PASSWORD = "Selenium#123";
    protected final String stamp = String.valueOf(System.currentTimeMillis());
    protected final String email = "selenium_" + stamp + "@test.dev";
    protected final String fullName = "Selenium Tester";

    @BeforeAll
    void startBrowser() {
        ChromeOptions options = new ChromeOptions();
        if (Config.HEADLESS) options.addArguments("--headless=new");
        options.addArguments("--window-size=1440,900", "--no-sandbox", "--disable-dev-shm-usage", "--remote-allow-origins=*");
        driver = new ChromeDriver(options);   // Selenium Manager downloads a matching chromedriver automatically
        wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    }

    @AfterAll
    void stopBrowser() {
        if (driver != null) driver.quit();
    }

    WebDriver driver() { return driver; }

    // ---------- navigation and actions ----------

    protected void open(String path) {
        driver.get(Config.BASE_URL + path);
    }

    protected void pause() {
        if (Config.SLOW_MS > 0) {
            try { Thread.sleep(Config.SLOW_MS); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }
    }

    protected WebElement visible(By by) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(by));
    }

    protected void click(By by) {
        pause();
        wait.until(ExpectedConditions.elementToBeClickable(by)).click();
        pause();
    }

    protected void type(By by, String text) {
        WebElement e = visible(by);
        e.clear();
        e.sendKeys(text);
        pause();
    }

    protected void waitForText(By by, String text) {
        wait.until(ExpectedConditions.textToBePresentInElementLocated(by, text));
    }

    protected String textOf(By by) {
        return visible(by).getText();
    }

    /** Input, textarea or select inside the open modal, found by its label text (labels look like "Title *"). */
    protected By modalField(String label) {
        return By.xpath("//div[@role='dialog']//label[span[starts-with(normalize-space(.),'" + label + "')]]"
                + "//*[self::input or self::textarea or self::select]");
    }

    protected By modalButton(String text) {
        return By.xpath("//div[@role='dialog']//button[contains(normalize-space(.),'" + text + "')]");
    }

    protected By heading(String text) {
        return By.xpath("//h3[normalize-space()='" + text + "']");
    }

    /** Creates a brand-new user through the API, stores its token like the app does, and opens the dashboard. */
    protected void loginViaApi() throws Exception {
        String token = ApiClient.register(Config.API_URL, fullName, email, PASSWORD);
        open("/login");
        ((JavascriptExecutor) driver).executeScript("localStorage.setItem('ss_token', arguments[0]);", token);
        open("/");
        waitForText(By.tagName("h1"), "Selenium");
    }
}
