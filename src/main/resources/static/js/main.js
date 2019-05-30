'use strict';

var usernameForm = document.querySelector('.usernameForm');
var publicMessageArea = document.querySelector('.messageArea');
var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var publicMessageForm = document.querySelector('.messageForm');
var publicMessageInput = document.querySelector('#message');
var privateChatPage = document.querySelector('#private-chat-page');
var privateMessageForm = document.querySelector('.private.messageForm');
var privateMessageInput = document.querySelector('#private-message');
var privateMessageArea = document.querySelector('.private.messageArea');

var closeButton = document.querySelector(".close");

var currentUsername = null;
var stompClient = null;
var privateRoomKey = null;
var privateRoomKeyMap = {};

function connect(event) {
    currentUsername = document.querySelector('#name').value.trim();

    console.log(currentUsername);

    if (currentUsername) {

        usernamePage.classList.add('hidden');

        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }

    event.preventDefault();
}

function onConnected() {

    stompClient.subscribe('/topic/public', onMessageReceived, onError());

    stompClient.send("/app/login",
        {}, // prazni headeri
        JSON.stringify({username: currentUsername, type: 'JOIN'})
    );
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    var messageElement = document.createElement('li');

    switch (message.type) {
        case 'JOIN':
            addEventMessage('joined!', message, messageElement);
            appendTextElement(message.content, messageElement);
            appendMsgElement(publicMessageArea, messageElement);
            break;
        case 'CHAT':
            prepareMessageWithPrivateListener(message.username, messageElement);
            appendTextElement(message.content, messageElement);
            appendMsgElement(publicMessageArea, messageElement);
            break;
        case 'PRIVATE':
            prepareMessage(message.username, messageElement);
            appendTextElement(message.content, messageElement);
            appendMsgElement(privateMessageArea, messageElement);
            break;
        case 'LEAVE':
            addEventMessage('left!', message, messageElement);
            appendTextElement(message.content, messageElement);
            appendMsgElement(publicMessageArea, messageElement);
            break;
        case 'INVITE':
            acceptInvite(message.username, message.privateRoomKey);
            break;
        default:
            console.log("Not implemented!")
    }
}

function sendMessage(event) {
    var messageContent = publicMessageInput.value.trim();

    if (messageContent && stompClient) {
        var chatMessage = {
            username: currentUsername,
            content: publicMessageInput.value,
            type: 'CHAT'
        };

        stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        publicMessageInput.value = '';
    }
    event.preventDefault();
}

function sendPrivateMessage(event) {
    var messageContent = privateMessageInput.value.trim();

    if (messageContent && stompClient) {
        var chatMessage = {
            username: currentUsername,
            content: privateMessageInput.value,
            privateRoomKey: privateRoomKey,
            type: 'PRIVATE'
        };

        stompClient.send("/app/sendPrivateMessage", {}, JSON.stringify(chatMessage));
        privateMessageInput.value = '';
    }
    event.preventDefault();
}

function showPrivate() {
    privateChatPage.classList.remove("hidden");
    chatPage.classList.add("hidden");
}

function hidePrivate() {
    privateChatPage.classList.add("hidden");
    chatPage.classList.remove("hidden");
}

function enterPrivate(withUsername) {
    showPrivate();

    generatePrivateRoomKey(currentUsername, withUsername, subscription);
}

function subscription(toUser) {

    if (!privateRoomKeyMap[privateRoomKey]) {
        stompClient.subscribe('/topic/private/' + privateRoomKey, onMessageReceived, onError());
        privateRoomKeyMap[privateRoomKey] = true;
    }

    sendInvite(toUser);
}

function sendInvite(toUser) {
    var invite = {
        username: toUser,
        type: 'INVITE',
        privateRoomKey: privateRoomKey // dat im hint da ne zaborave ovo dodati
    };
    stompClient.send("/app/sendMessage", {}, JSON.stringify(invite));
}

function acceptInvite(toUser, roomKey) {
    if (currentUsername !== toUser) {
        return;
    }

    showPrivate();

    if (!privateRoomKeyMap[roomKey]) {
        stompClient.subscribe('/topic/private/' + roomKey, onMessageReceived, onError());
        privateRoomKeyMap[roomKey] = true;
    }

    privateRoomKey = roomKey;
}

function generatePrivateRoomKey(fromUser, toUser, subscription) {
    var url = 'http://localhost:8080/generateKey?from=' + fromUser + '&to=' + toUser;
    $.get(url, function (generatedKey) {
        privateRoomKey = generatedKey;
        subscription(toUser);
    });
}

usernameForm.addEventListener('submit', connect, true);
publicMessageForm.addEventListener('submit', sendMessage, true);
privateMessageForm.addEventListener('submit', sendPrivateMessage, true);
closeButton.addEventListener('click', hidePrivate, true);


