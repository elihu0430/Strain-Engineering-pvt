import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

/** Starts a dependency-free local preview server for the static website. */
public final class Main {
    private static final int PORT = 4173;
    private static final Map<String, String> CONTENT_TYPES = Map.of(
            "css", "text/css; charset=utf-8", "gif", "image/gif",
            "html", "text/html; charset=utf-8", "jpeg", "image/jpeg",
            "jpg", "image/jpeg", "js", "text/javascript; charset=utf-8",
            "png", "image/png", "svg", "image/svg+xml", "webp", "image/webp"
    );

    private Main() { }

    public static void main(String[] args) throws IOException {
        Path siteRoot = findSiteRoot();
        try (ServerSocket server = new ServerSocket(PORT)) {
            System.out.printf("Strain Engineering preview is running at http://127.0.0.1:%d/%n", PORT);
            System.out.println("Press Ctrl+C to stop the server.");
            while (true) {
                try (Socket client = server.accept()) {
                    serve(client, siteRoot);
                } catch (IOException exception) {
                    System.err.println("Could not serve request: " + exception.getMessage());
                }
            }
        }
    }

    private static Path findSiteRoot() {
        Path workingDirectory = Path.of("").toAbsolutePath();
        Path sourceDirectory = workingDirectory.resolve("src");
        return Files.isRegularFile(sourceDirectory.resolve("index.html")) ? sourceDirectory : workingDirectory;
    }

    private static void serve(Socket client, Path siteRoot) throws IOException {
        BufferedReader request = new BufferedReader(new InputStreamReader(client.getInputStream(), StandardCharsets.US_ASCII));
        String requestLine = request.readLine();
        if (requestLine == null || !requestLine.startsWith("GET ")) {
            return;
        }
        String header;
        while ((header = request.readLine()) != null && !header.isEmpty()) {
            // Consume headers before writing the response.
        }

        String requestedPath = requestLine.split(" ")[1].split("\\?")[0];
        String relativePath = requestedPath.equals("/") ? "index.html" : requestedPath.substring(1);
        Path target = siteRoot.resolve(relativePath).normalize();
        if (!target.startsWith(siteRoot) || !Files.isRegularFile(target)) {
            writeResponse(client.getOutputStream(), 404, "text/plain; charset=utf-8", "404 - Page not found".getBytes(StandardCharsets.UTF_8));
            return;
        }

        writeResponse(client.getOutputStream(), 200, CONTENT_TYPES.getOrDefault(extensionOf(target), "application/octet-stream"), Files.readAllBytes(target));
    }

    private static void writeResponse(OutputStream output, int status, String contentType, byte[] body) throws IOException {
        String reason = status == 200 ? "OK" : "Not Found";
        String headers = "HTTP/1.1 " + status + " " + reason + "\r\n"
                + "Content-Type: " + contentType + "\r\n"
                + "Content-Length: " + body.length + "\r\nConnection: close\r\n\r\n";
        output.write(headers.getBytes(StandardCharsets.US_ASCII));
        output.write(body);
    }

    private static String extensionOf(Path file) {
        String name = file.getFileName().toString();
        int dot = name.lastIndexOf('.');
        return dot >= 0 ? name.substring(dot + 1).toLowerCase() : "";
    }
}
