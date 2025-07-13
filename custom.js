// custom.js

const APP_VERSION = '1.0.7'; // <--- OVDJE SADA MIJENJAŠ VERZIJU!
// --- Funkcije za tvoju aplikaciju ---
function displayText() {
    const inputText = document.getElementById('inputText').value;
    document.getElementById('output').innerText = inputText || 'Tvoj tekst će se prikazati ovdje';
}

function updateFontSize() {
    const fontSizeInput = document.getElementById('fontSize');
    const outputElement = document.getElementById('output');
    if (fontSizeInput && outputElement) {
        const fontSize = fontSizeInput.value;
        outputElement.style.fontSize = fontSize + 'px';
    }
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

// Inicijalizacija pri učitavanju DOM-a
document.addEventListener('DOMContentLoaded', () => {
    displayText();
    updateFontSize();

    const appVersionElement = document.getElementById('appVersion');
    if (appVersionElement) {
        appVersionElement.innerText = `Verzija: ${APP_VERSION}`;
    }
});

// --- PWA Service Worker Registracija i Logika za "Instaliraj aplikaciju" gumb ---
let deferredPrompt;

const installButton = document.getElementById('installButton');
const updateNotification = document.getElementById('updateNotification');
const reloadAppButton = document.getElementById('reloadAppButton');

// Varijabla za pohranu Service Workera koji čeka aktivaciju
let newWorker;

// Service Worker Registracija
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`/service-worker.js?v=${APP_VERSION}`)
      .then(registration => {
        console.log('Service Worker registered! Scope:', registration.scope);

        // Ovaj event se pokreće kada preglednik pronađe novog Service Workera
        registration.addEventListener('updatefound', () => {
            newWorker = registration.installing; // Dohvati Service Worker koji se instalira

            if (newWorker) {
                // Slušaj promjene stanja novog Service Workera
                newWorker.addEventListener('statechange', () => {
                    // Kada se novi Service Worker instalira, a stari je još aktivan (kontrolira stranicu)
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Prikaži obavijest korisniku da je nova verzija dostupna
                        if (updateNotification) {
                            updateNotification.style.display = 'block';
                            console.log('New content is available! Displaying update notification.');
                        }
                    }
                });
            }
        });
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
      });
  });

// Slušaj poruke od Service Workera
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'RELOAD_PAGE') {
        console.log('Service Worker requested page reload. Reloading now...');
        window.location.reload(); // Ovo će prisiliti potpuno osvježavanje stranice
    }
  });
}
  // Dodatni listener da odmah aktiviramo novog Service Workera ako postoji
  // i ako korisnik otvori aplikaciju nakon što je nova verzija već instalirana u pozadini
  navigator.serviceWorker.ready.then(registration => {
    if (registration.active && registration.waiting) {
      // Ako postoji waiting worker (novi), i active worker (stari)
      // I ako korisnik nema otvorenu obavijest, možemo je pokazati
      if (!updateNotification || updateNotification.style.display === 'none') {
          newWorker = registration.waiting;
          if (newWorker) {
              if (updateNotification) {
                  updateNotification.style.display = 'block';
                  console.log('New content available on app start! Displaying update notification.');
              }
          }
      }
    }
  });

  // Slušaj poruke od Service Workera (ako šalje poruke)
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'RELOAD_PAGE') {
        console.log('Service Worker requested page reload.');
        window.location.reload();
    }
  });

} else {
  console.log('Service Workers are not supported in this browser.');
}

// Logika za "Instaliraj aplikaciju" gumb
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installButton) {
    installButton.style.display = 'block';
    console.log('beforeinstallprompt event fired. Install button shown.');
  }
});

if (installButton) {
    installButton.addEventListener('click', async () => {
        installButton.style.display = 'none';

        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
        }
    });
}

window.addEventListener('appinstalled', () => {
  if (installButton) {
    installButton.style.display = 'none';
  }
  console.log('PWA was successfully installed!');
});

if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
  console.log('App is running in standalone mode (already installed). Hiding install button.');
  if (installButton) {
    installButton.style.display = 'none';
  }
}

// --- Logika za Osvježavanje Aplikacije ---
if (reloadAppButton) {
    reloadAppButton.addEventListener('click', () => {
        if (newWorker) {
            // Pošalji poruku Service Workeru da se odmah aktivira
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            console.log('Sent SKIP_WAITING message to new Service Worker.');
        }
        if (updateNotification) {
            updateNotification.style.display = 'none';
        }
    });
}