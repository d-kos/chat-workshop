var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function createAvatarElement(username) {
    var avatarElement = document.createElement('i');
    var avatarText = document.createTextNode(username[0]);

    avatarElement.appendChild(avatarText);
    avatarElement.style['background-color'] = getAvatarColor(username);

    return avatarElement;
}

function createUsernameElement(username) {
    var usernameElement = document.createElement('span');
    var usernameText = document.createTextNode(username);
    usernameElement.appendChild(usernameText);

    return usernameElement;
}

function createTextElement(content) {
    var textElement = document.createElement('p');
    var messageText = document.createTextNode(content);
    textElement.appendChild(messageText);

    return textElement;
}

function getAvatarColor(username) {
    var hash = 0;
    for (var i = 0; i < username.length; i++) {
        hash = 31 * hash + username.charCodeAt(i);
    }

    var index = Math.abs(hash % colors.length);
    return colors[index];
}

function addEventMessage(text, message, messageElement) {
    messageElement.classList.add('event-message');
    message.content = message.username + ' ' + text;
}

function appendTextElement(content, messageElement) {
    var textElement = createTextElement(content);
    messageElement.appendChild(textElement);
}

function appendMsgElement(messageArea, messageElement) {
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function onError() {
    console.log('Could not connect to WebSocket server. Please refresh this page to try again!');
}

function prepareMessage(username, messageElement) {
    messageElement.classList.add('chat-message');

    var avatarElement = createAvatarElement(username);
    messageElement.appendChild(avatarElement);

    var usernameElement = createUsernameElement(username);
    messageElement.appendChild(usernameElement);
}

function prepareMessageWithPrivateListener(username, messageElement) {
    messageElement.classList.add('chat-message');

    var avatarElement = createAvatarElement(username);
    if (currentUsername !== username) {
        avatarElement.addEventListener("click", function () { enterPrivate(username) });
    }
    messageElement.appendChild(avatarElement);

    var usernameElement = createUsernameElement(username);
    messageElement.appendChild(usernameElement);
}
