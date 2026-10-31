package com.studysphere.tests;

import org.junit.platform.engine.TestExecutionResult;
import org.junit.platform.engine.support.descriptor.MethodSource;
import org.junit.platform.launcher.TestExecutionListener;
import org.junit.platform.launcher.TestIdentifier;
import org.junit.platform.launcher.TestPlan;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/** Writes a readable report to target/report/index.html after the run (auto-registered via META-INF/services). */
public class HtmlReportListener implements TestExecutionListener {

    private record Row(String group, String name, String status, long ms, String detail, String shot) {}

    private final List<Row> rows = new CopyOnWriteArrayList<>();
    private final Map<String, Long> started = new ConcurrentHashMap<>();

    @Override
    public void executionStarted(TestIdentifier id) {
        if (id.isTest()) started.put(id.getUniqueId(), System.currentTimeMillis());
    }

    @Override
    public void executionFinished(TestIdentifier id, TestExecutionResult result) {
        if (!id.isTest()) return;
        long ms = System.currentTimeMillis() - started.getOrDefault(id.getUniqueId(), System.currentTimeMillis());
        String group = "", shot = "";
        if (id.getSource().orElse(null) instanceof MethodSource src) {
            group = src.getClassName().substring(src.getClassName().lastIndexOf('.') + 1);
            shot = group + "." + src.getMethodName() + ".png";
        }
        String detail = result.getThrowable().map(t -> String.valueOf(t.getMessage())).orElse("");
        rows.add(new Row(group, id.getDisplayName(), result.getStatus().name(), ms, detail, shot));
    }

    @Override
    public void testPlanExecutionFinished(TestPlan plan) {
        if (rows.isEmpty()) return;
        long passed = rows.stream().filter(r -> r.status().equals("SUCCESSFUL")).count();
        long failed = rows.size() - passed;
        StringBuilder h = new StringBuilder();
        h.append("<!doctype html><html lang='en'><head><meta charset='utf-8'><title>StudySphere test report</title><style>")
         .append("body{font-family:Segoe UI,Arial,sans-serif;background:#F4F2FC;color:#1B1F3B;margin:0;padding:32px}")
         .append("h1{margin:0 0 4px}.sub{color:#6B7194;margin-bottom:20px}")
         .append(".cards{display:flex;gap:14px;margin-bottom:22px}.c{background:#fff;border:1px solid #E6E3F5;border-radius:16px;padding:14px 22px}")
         .append(".c b{font-size:28px;display:block}table{width:100%;border-collapse:collapse;background:#fff;border-radius:16px;overflow:hidden}")
         .append("th,td{text-align:left;padding:10px 14px;border-bottom:1px solid #E6E3F5;vertical-align:top;font-size:14px}th{background:#14173A;color:#fff}")
         .append(".ok{color:#2FB67C;font-weight:700}.bad{color:#E5576B;font-weight:700}img{max-width:520px;border-radius:8px;margin-top:8px;border:1px solid #E6E3F5}")
         .append("</style></head><body><h1>StudySphere test report</h1><div class='sub'>")
         .append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")))
         .append(" &middot; target: ").append(esc(Config.BASE_URL)).append("</div><div class='cards'>")
         .append("<div class='c'><b>").append(rows.size()).append("</b>Total</div>")
         .append("<div class='c'><b class='ok'>").append(passed).append("</b>Passed</div>")
         .append("<div class='c'><b class='").append(failed == 0 ? "ok" : "bad").append("'>").append(failed).append("</b>Failed</div></div>")
         .append("<table><tr><th>Suite</th><th>Test</th><th>Result</th><th>Time</th></tr>");
        for (Row r : rows) {
            boolean ok = r.status().equals("SUCCESSFUL");
            h.append("<tr><td>").append(esc(r.group())).append("</td><td>").append(esc(r.name()));
            if (!ok) {
                h.append("<div style='color:#E5576B;margin-top:6px;white-space:pre-wrap'>").append(esc(firstLines(r.detail()))).append("</div>");
                if (!r.shot().isEmpty() && Files.exists(Path.of("target", "report", "screenshots", r.shot())))
                    h.append("<br><img src='screenshots/").append(esc(r.shot())).append("' alt='failure screenshot'>");
            }
            h.append("</td><td class='").append(ok ? "ok" : "bad").append("'>").append(ok ? "PASSED" : "FAILED")
             .append("</td><td>").append(String.format("%.1f s", r.ms() / 1000.0)).append("</td></tr>");
        }
        h.append("</table></body></html>");
        try {
            Path dir = Path.of("target", "report");
            Files.createDirectories(dir);
            Files.writeString(dir.resolve("index.html"), h.toString());
            System.out.println("HTML report: " + dir.resolve("index.html").toAbsolutePath());
        } catch (Exception e) {
            System.err.println("Could not write HTML report: " + e.getMessage());
        }
    }

    private static String firstLines(String s) {
        String[] lines = s.split("\\R");
        return String.join("\n", java.util.Arrays.copyOf(lines, Math.min(lines.length, 4)));
    }

    private static String esc(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("'", "&#39;");
    }
}
