package com.studysphere.tests;

/** Run-time settings, overridable with -D flags, e.g. mvn test -Dheadless=true -DslowMs=700 */
public final class Config {
    private Config() {}

    /** Where the React frontend is served (Docker Compose maps it to port 3000). */
    public static final String BASE_URL = System.getProperty("baseUrl", "http://localhost:3000");
    /** API gateway, used to create test users quickly without clicking through the UI. */
    public static final String API_URL = System.getProperty("apiUrl", "http://localhost:8081/api");
    /** true = no browser window (for Jenkins). */
    public static final boolean HEADLESS = Boolean.getBoolean("headless");
    /** Pause after every action in milliseconds, so people can follow along in a live demo. */
    public static final long SLOW_MS = Long.getLong("slowMs", 0L);
}
