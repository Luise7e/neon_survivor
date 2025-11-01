package com.luise7e.neonsurvivor;

import android.content.Context;
import android.content.res.AssetManager;
import android.util.Log;
import fi.iki.elonen.NanoHTTPD;
import java.io.IOException;
import java.io.InputStream;

public class AssetServer extends NanoHTTPD {
    private static final String TAG = "AssetServer";
    private final AssetManager assetManager;

    public AssetServer(Context context, int port) {
        super(port);
        this.assetManager = context.getAssets();
    }

    @Override
    public Response serve(IHTTPSession session) {
        String uri = session.getUri();
        
        // Remove leading slash
        if (uri.startsWith("/")) {
            uri = uri.substring(1);
        }
        
        // Default to index.html
        if (uri.isEmpty() || uri.equals("/")) {
            uri = "index.html";
        }

        try {
            // Try to load the asset
            InputStream inputStream = assetManager.open(uri);
            String mimeType = getMimeType(uri);
            
            Log.d(TAG, "✅ Serving: " + uri + " (" + mimeType + ")");
            return newChunkedResponse(Response.Status.OK, mimeType, inputStream);
            
        } catch (IOException e) {
            Log.e(TAG, "❌ Asset not found: " + uri);
            return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "404 - Not Found");
        }
    }

    private String getMimeType(String filename) {
        if (filename.endsWith(".html")) return "text/html";
        if (filename.endsWith(".js")) return "application/javascript";
        if (filename.endsWith(".css")) return "text/css";
        if (filename.endsWith(".json")) return "application/json";
        if (filename.endsWith(".png")) return "image/png";
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
        if (filename.endsWith(".gif")) return "image/gif";
        if (filename.endsWith(".svg")) return "image/svg+xml";
        if (filename.endsWith(".ico")) return "image/x-icon";
        if (filename.endsWith(".mp3")) return "audio/mpeg";
        if (filename.endsWith(".ogg")) return "audio/ogg";
        if (filename.endsWith(".wav")) return "audio/wav";
        if (filename.endsWith(".woff")) return "font/woff";
        if (filename.endsWith(".woff2")) return "font/woff2";
        if (filename.endsWith(".ttf")) return "font/ttf";
        return "application/octet-stream";
    }
}
