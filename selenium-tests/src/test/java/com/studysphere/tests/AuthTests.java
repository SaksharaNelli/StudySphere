package com.studysphere.tests;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.openqa.selenium.By;

import static org.junit.jupiter.api.Assertions.assertTrue;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Authentication")
class AuthTests extends BaseTest {

    private final By errorBox = By.xpath("//div[contains(@class,'text-bad')]");
    private final By logout = By.cssSelector("button[aria-label='Log out']");

    @Test @Order(1) @DisplayName("A new student can register and lands on the dashboard")
    void registerNewUser() {
        open("/register");
        type(By.name("name"), fullName);
        type(By.name("email"), email);
        type(By.name("password"), PASSWORD);
        click(By.id("register-btn"));
        waitForText(By.tagName("h1"), "Selenium");
        assertTrue(textOf(By.tagName("h1")).startsWith("Good"), "Dashboard greeting should be shown");
    }

    @Test @Order(2) @DisplayName("Logout returns to the login page")
    void logoutReturnsToLogin() {
        click(logout);
        assertTrue(visible(By.id("login-btn")).isDisplayed());
    }

    @Test @Order(3) @DisplayName("Protected pages redirect to login when logged out")
    void protectedPageRedirects() {
        open("/assignments");
        assertTrue(visible(By.id("login-btn")).isDisplayed());
    }

    @Test @Order(4) @DisplayName("Empty login shows a validation message")
    void emptyLoginShowsValidation() {
        open("/login");
        click(By.id("login-btn"));
        waitForText(errorBox, "Enter a valid email address");
    }

    @Test @Order(5) @DisplayName("Wrong password is rejected")
    void wrongPasswordRejected() {
        open("/login");
        type(By.id("email"), email);
        type(By.id("password"), "definitely-wrong");
        click(By.id("login-btn"));
        waitForText(errorBox, "Incorrect email or password");
    }

    @Test @Order(6) @DisplayName("Valid credentials log the student in")
    void validLogin() {
        open("/login");
        type(By.id("email"), email);
        type(By.id("password"), PASSWORD);
        click(By.id("login-btn"));
        waitForText(By.tagName("h1"), "Selenium");
        assertTrue(visible(logout).isDisplayed());
    }
}
