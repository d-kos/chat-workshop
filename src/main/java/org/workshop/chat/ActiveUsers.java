package org.workshop.chat;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ActiveUsers {

    private final Map<String, String> users = new ConcurrentHashMap<>();

    public void put(String sessionId, String username) {
        users.put(sessionId, username);
    }

    public String getUsername(String sessionId) {
        return users.get(sessionId);
    }

    public void remove(String sessionId) {
        users.remove(sessionId);
    }
}
