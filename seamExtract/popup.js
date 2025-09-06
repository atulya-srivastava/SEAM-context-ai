document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const sendButton = document.getElementById('send-button');
    const statusMessage = document.getElementById('status-message');

    // Load saved text from storage when the popup opens
    chrome.storage.local.get(['savedText'], function(result) {
        if (result.savedText) {
            textInput.value = result.savedText;
        }
    });

    // Save text to storage whenever it changes
    textInput.addEventListener('input', () => {
        chrome.storage.local.set({ savedText: textInput.value });
    });

    sendButton.addEventListener('click', () => {
        const textToSend = textInput.value.trim();
        statusMessage.textContent = ''; // Clear previous status

        if (!textToSend) {
            statusMessage.textContent = 'Please enter some text.';
            return;
        }

        // Disable button and show loading state
        sendButton.disabled = true;
        sendButton.textContent = 'Loading...';

        const apiUrl = 'https://n0va31.app.n8n.cloud/webhook/1f5babc6-d9ce-40ef-a32a-be6a94ad73e2';
        const postData = {
            sessionId: "bdbdb", // Updated sessionId
            chatInput: textToSend
        };

        console.log('Step 1: Preparing to send data to API.');
        console.log('API URL:', apiUrl);
        console.log('Data being sent:', JSON.stringify(postData, null, 2));

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        })
        .then(response => {
            console.log('Step 2: Received raw response from server.', response);
            if (!response.ok) {
                // If the server response is not ok (e.g., 404, 500), throw an error
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Step 3: Parsed JSON data from response:', data);
            // UPDATED: Now looking for the 'output' field from your API response
            const apiResponse = data.output || 'No "output" field found in the returned data.';
            console.log('Step 4: Extracted API response text:', apiResponse);
            
            textInput.value = apiResponse;
            // Also save the new response to storage
            chrome.storage.local.set({ savedText: apiResponse });
        })
        .catch(error => {
            console.error('API Error:', error);
            statusMessage.textContent = `Error: ${error.message}`;
            // Keep the original text in the textarea on error
        })
        .finally(() => {
            console.log('Step 5: API call finished.');
            // Re-enable the button and restore its text
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
        });
    });
});

