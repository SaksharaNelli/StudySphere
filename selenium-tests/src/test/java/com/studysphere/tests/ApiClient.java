package com.studysphere.tests;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Minimal HTTP helper: registers a fresh test user through the gateway and returns its JWT. */
public final class ApiClient {
    private ApiClient() {}

    public static String register(String apiUrl, String name, String email, String password) throws Exception {
        String body = String.format("{\"name\":\"%s\",\"email\":\"%s\",\"password\":\"%s\"}", name, email, password);
        HttpRequest req = HttpRequest.newBuilder(URI.create(apiUrl + "/auth/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> res = HttpClient.newHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 201) {
            throw new IllegalStateException("Could not register test user (" + res.statusCode() + "): " + res.body()
                    + " | Is the stack running and is -DapiUrl correct? Current: " + apiUrl);
        }
        Matcher m = Pattern.compile("\"token\":\"([^\"]+)\"").matcher(res.body());
        if (!m.find()) throw new IllegalStateException("No token in response: " + res.body());
        return m.group(1);
    }
}
