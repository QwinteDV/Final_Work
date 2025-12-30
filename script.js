console.log('Script loaded');

const micButton = document.getElementById('micButton');
const result = document.getElementById('result');
const status = document.getElementById('status');
const error = document.getElementById('error');
const aiResponse = document.getElementById('aiResponse');

console.log('Script loaded');

console.log('Elements found:', {
    micButton: !!micButton,
    result: !!result,
    status: !!status,
    error: !!error,
    aiResponse: !!aiResponse
});

let mediaRecorder;
let audioChunks = [];

// Check of browser media recording ondersteunt
const MediaRecorder = window.MediaRecorder;
console.log('MediaRecorder available:', !!MediaRecorder);

if (!MediaRecorder) {
    error.textContent = 'Je browser ondersteunt geen audio recording. Gebruik Chrome of Edge.';
    micButton.disabled = true;
} else {
    // Microfoon klik event
    micButton.addEventListener('click', async () => {
        if (micButton.classList.contains('listening')) {
            stopRecording();
        } else {
            await startRecording();
        }
    });
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await transcribeAudio(audioBlob);
        };

        mediaRecorder.start();
        micButton.classList.add('listening');
        status.textContent = 'Opnemen...';
        error.textContent = '';

    } catch (err) {
        error.textContent = `Microfoon fout: ${err.message}`;
        console.error('Recording error:', err);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        micButton.classList.remove('listening');
        status.textContent = 'Verwerken...';
    }
}

async function transcribeAudio(audioBlob) {
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
        });

        const responseText = await response.text();
        
        if (!response.ok) {
            console.error('API Response:', response.status, responseText);
            throw new Error(`Transcription failed: ${responseText}`);
        }

        const data = JSON.parse(responseText);
        result.textContent = data.text;
        
        // Console log wat de user heeft gezegd
        console.log('User zei:', data.text);
        
        // Get AI response
        await getAIResponse(data.text);
        
        status.textContent = 'Klaar om te luisteren';

    } catch (err) {
        error.textContent = `Transcriptie fout: ${err.message}`;
        status.textContent = 'Klaar om te luisteren';
        console.error('Transcription error:', err);
    }
}

async function getAIResponse(message) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error('AI response failed');
        }

        const data = await response.json();
        aiResponse.textContent = data.response;

    } catch (err) {
        console.error('AI error:', err);
        aiResponse.textContent = 'AI reactie mislukt';
    }
}