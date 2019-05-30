package org.workshop.chat.model;

public class Message {
    private String type;
    private String username;
    private String content;
    private String privateRoomKey;

    public String getPrivateRoomKey() {
        return privateRoomKey;
    }

    public void setPrivateRoomKey(String privateRoomKey) {
        this.privateRoomKey = privateRoomKey;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
