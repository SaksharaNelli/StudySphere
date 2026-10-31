package com.studysphere.tests;

import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestWatcher;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

import java.nio.file.Files;
import java.nio.file.Path;

/** Saves a screenshot of the browser whenever a test fails; the HTML report links to it. */
public class ScreenshotOnFailure implements TestWatcher {

    @Override
    public void testFailed(ExtensionContext ctx, Throwable cause) {
        Object instance = ctx.getRequiredTestInstance();
        if (!(instance instanceof BaseTest test) || test.driver() == null) return;
        try {
            byte[] png = ((TakesScreenshot) test.driver()).getScreenshotAs(OutputType.BYTES);
            Path dir = Path.of("target", "report", "screenshots");
            Files.createDirectories(dir);
            Files.write(dir.resolve(ctx.getRequiredTestClass().getSimpleName() + "." + ctx.getRequiredTestMethod().getName() + ".png"), png);
        } catch (Exception ignored) {
            // screenshots are best effort
        }
    }
}
