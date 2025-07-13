function displayText() {
    const inputText = document.getElementById('inputText').value;
    document.getElementById('output').innerText = inputText;
}

function clearInput() {
    const inputTextElement = document.getElementById('inputText');
    if (inputTextElement) { 
        inputTextElement.value = '';
    }
    const outputElement = document.getElementById('output');
    if (outputElement) { 
        outputElement.innerText = 'Tvoj tekst će se prikazati ovdje';
    }
    if (inputTextElement) { 
        inputTextElement.focus();
    }
}

function updateFontSize() {
    const fontSizeInput = document.getElementById('fontSize');
    const outputElement = document.getElementById('output');
    if (fontSizeInput && outputElement) {
        const fontSize = fontSizeInput.value;
        outputElement.style.fontSize = fontSize + 'px';
    }
}

window.addEventListener('load', () => {
    updateFontSize();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
        .then(reg => {
        console.log('Service Worker registered:', reg);
        })
        .catch(err => {
        console.error('Service Worker registration failed:', err);
        });
    });
}
