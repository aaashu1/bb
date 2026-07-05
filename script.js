/*=========================================================
    BIRTHDAY EXPERIENCE â€” MAIN SCRIPT
    Flow: Cake -> Light candles -> Blow (mic) -> Celebration
          -> Envelope -> Book
=========================================================*/

document.addEventListener("DOMContentLoaded", init);

/*---------------------------------------------------------
    STATE
---------------------------------------------------------*/

let audioContext, analyser, microphone, dataArray;
let blowingProgress = 0;
let listening = false;
let micAvailable = true;
let manualDecayInterval = null;
let currentPage = 0;
let fallbackMusicContext = null;
let fallbackMusicTimer = null;

/* DOM refs, filled in init() */
let cakeScene, celebrationScene, envelopeScene, bookScene;
let lightButton, blowButton, manualBlowButton;
let cake, flames, smokes, blowContainer, progressFill;
let birthdaySong, popSound, whooshSound;
let envelope, cover, pages, prevPageBtn, nextPageBtn;

/*=========================================================
    INIT
=========================================================*/

function init(){

    // Scenes

    cakeScene = document.getElementById("cakeScene");
    celebrationScene = document.getElementById("celebrationScene");
    envelopeScene = document.getElementById("envelopeScene");
    bookScene = document.getElementById("bookScene");

    // Buttons

    lightButton = document.getElementById("lightButton");
    blowButton = document.getElementById("blowButton");
    manualBlowButton = document.getElementById("manualBlowButton");

    // Cake

    cake = document.querySelector(".cake");
    flames = document.querySelectorAll(".flame");
    smokes = document.querySelectorAll(".smoke");

    // Blow bar

    blowContainer = document.querySelector(".blowContainer");
    progressFill = document.getElementById("progressFill");

    // Audio

    birthdaySong = document.getElementById("birthdaySong");
    popSound = document.getElementById("popSound");
    whooshSound = document.getElementById("whooshSound");

    // Envelope / book

    envelope = document.getElementById("envelope");
    cover = document.querySelector(".cover");
    pages = document.querySelectorAll(".page");
    prevPageBtn = document.getElementById("prevPage");
    nextPageBtn = document.getElementById("nextPage");

    bindEvents();
    resetScenes();
    createFairyLights();
    setupPageImages();
    setupAudioWarnings();
    displayPage();
}

/*=========================================================
    SAFETY NET
    Guarantees exactly one scene is visible on load (the cake),
    no matter what classes happen to be on the markup.
=========================================================*/

function resetScenes(){

    [cakeScene, celebrationScene, envelopeScene, bookScene].forEach(scene => {

        scene.classList.remove("active");

        scene.classList.add("hidden");

    });

    cakeScene.classList.remove("hidden");

    cakeScene.classList.add("active");

}

/*=========================================================
    EVENTS
=========================================================*/

function bindEvents(){

    lightButton.addEventListener("click", lightCandles);

    blowButton.addEventListener("click", () => {

        blowButton.classList.add("hidden");

        startListening();

    });

    manualBlowButton.addEventListener("click", manualBlow);

    envelope.addEventListener("click", openEnvelope);

    nextPageBtn.addEventListener("click", () => {

        if (currentPage < pages.length - 1){

            currentPage++;

            displayPage();

        }

    });

    prevPageBtn.addEventListener("click", () => {

        if (currentPage > 0){

            currentPage--;

            displayPage();

        }

    });

    window.addEventListener("resize", resizeConfettiCanvas);

}

/*=========================================================
    SAFE AUDIO HELPER
    (never let a missing/blocked audio file break the flow)
=========================================================*/

function safePlay(audioEl){

    if (!audioEl) return;

    try{

        const playPromise = audioEl.play();

        if (playPromise && playPromise.catch){

            playPromise.catch(() => showAudioWarning(audioEl));

        }

    }

    catch(error){ showAudioWarning(audioEl); }

}

function showAudioWarning(audioEl){

    if (audioEl !== birthdaySong) return;

    const hint = document.getElementById("blowHint");

    if (!hint) return;

    hint.textContent = "Music file missing, so a built-in birthday tune is playing instead.";

    playFallbackBirthdayTune();

}

function setupAudioWarnings(){

    [birthdaySong, popSound, whooshSound].forEach(audioEl => {

        if (!audioEl) return;

        audioEl.addEventListener("error", () => showAudioWarning(audioEl));

    });

}
function playFallbackBirthdayTune(){

    if (fallbackMusicTimer) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;

    if (!AudioCtx) return;

    fallbackMusicContext = fallbackMusicContext || new AudioCtx();

    const notes = [
        264, 264, 297, 264, 352, 330,
        264, 264, 297, 264, 396, 352,
        264, 264, 528, 440, 352, 330, 297,
        466, 466, 440, 352, 396, 352
    ];

    let index = 0;

    const playNote = () => {

        const frequency = notes[index % notes.length];
        const osc = fallbackMusicContext.createOscillator();
        const gain = fallbackMusicContext.createGain();

        osc.type = "sine";
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, fallbackMusicContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, fallbackMusicContext.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, fallbackMusicContext.currentTime + 0.28);

        osc.connect(gain);
        gain.connect(fallbackMusicContext.destination);
        osc.start();
        osc.stop(fallbackMusicContext.currentTime + 0.32);

        index++;

    };

    playNote();
    fallbackMusicTimer = setInterval(playNote, 330);

}

function stopFallbackBirthdayTune(){

    if (fallbackMusicTimer){

        clearInterval(fallbackMusicTimer);
        fallbackMusicTimer = null;

    }

}
/*=========================================================
    LIGHT CANDLES
=========================================================*/

function lightCandles(){

    lightButton.classList.add("hidden");

    blowButton.classList.remove("hidden");

    blowContainer.classList.remove("hidden");

    cake.classList.add("glow");

    birthdaySong.currentTime = 0;

    birthdaySong.volume = 1;

    safePlay(birthdaySong);

    lightOneByOne();

}

function lightOneByOne(){

    flames.forEach((flame, index) => {

        setTimeout(() => {

            flame.classList.add("lit");

            safePlay(popSound);

        }, index * 350);

    });

}

/*=========================================================
    MICROPHONE LISTENING
=========================================================*/

async function startListening(){

    if (listening) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){

        micAvailable = false;

        showManualFallback();

        return;

    }

    listening = true;

    try{

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        analyser = audioContext.createAnalyser();

        analyser.fftSize = 512;

        microphone = audioContext.createMediaStreamSource(stream);

        microphone.connect(analyser);

        dataArray = new Uint8Array(analyser.frequencyBinCount);

        detectBlow();

    }

    catch(error){

        listening = false;

        micAvailable = false;

        showManualFallback();

    }

}

function showManualFallback(){

    document.getElementById("blowHint").textContent =
        "Couldn't access your microphone â€” tap the button below instead!";

    manualBlowButton.classList.remove("hidden");

}

/*=========================================================
    DETECT BLOW (microphone volume loop)
=========================================================*/

function detectBlow(){

    analyser.getByteFrequencyData(dataArray);

    let volume = 0;

    for (let i = 0; i < dataArray.length; i++){

        volume += dataArray[i];

    }

    volume /= dataArray.length;

    updateFlames(volume);

    if (volume > 18){

        blowingProgress += 1.2;

    }

    else{

        blowingProgress -= 0.8;

    }

    blowingProgress = Math.max(0, Math.min(100, blowingProgress));

    progressFill.style.width = blowingProgress + "%";

    if (blowingProgress >= 100){

        candlesOut();

        return;

    }

    requestAnimationFrame(detectBlow);

}

/*=========================================================
    MANUAL BLOW (no-mic fallback)
    Each tap gives a burst of progress; progress slowly
    decays if the user stops tapping, just like blowing.
=========================================================*/

function manualBlow(){

    blowingProgress = Math.min(100, blowingProgress + 14);

    updateFlames(30);

    progressFill.style.width = blowingProgress + "%";

    if (!manualDecayInterval){

        manualDecayInterval = setInterval(() => {

            blowingProgress = Math.max(0, blowingProgress - 4);

            progressFill.style.width = blowingProgress + "%";

            updateFlames(blowingProgress > 0 ? 10 : 0);

        }, 300);

    }

    if (blowingProgress >= 100){

        clearInterval(manualDecayInterval);

        manualDecayInterval = null;

        candlesOut();

    }

}

/*=========================================================
    FLAME MOVEMENT
=========================================================*/

function updateFlames(volume){

    flames.forEach(flame => {

        if (!flame.classList.contains("lit")) return;

        const bend = Math.min(volume * 2, 40);

        flame.style.transform =
            `translateX(-50%) rotate(${-45 + bend}deg) scale(${1 + volume / 100})`;

    });

}

/*=========================================================
    FADE OUT THE BIRTHDAY SONG
=========================================================*/

function fadeMusic(){

    stopFallbackBirthdayTune();

    if (birthdaySong.paused) return;

    const fadeStep = setInterval(() => {

        if (birthdaySong.volume > 0.05){

            birthdaySong.volume = Math.max(0, birthdaySong.volume - 0.05);

        }

        else{

            birthdaySong.volume = 0;

            birthdaySong.pause();

            clearInterval(fadeStep);

        }

    }, 80);

}

/*=========================================================
    CANDLES OUT
=========================================================*/

function candlesOut(){

    if (manualDecayInterval){

        clearInterval(manualDecayInterval);

        manualDecayInterval = null;

    }

    listening = false;

    fadeMusic();

    flames.forEach(flame => {

        flame.classList.remove("lit");

    });

    smokes.forEach(smoke => {

        smoke.classList.add("show");

    });

    cake.classList.remove("glow");

    blowButton.classList.add("hidden");

    blowContainer.classList.add("hidden");

    setTimeout(() => {

        startCelebration();

    }, 1800);

}

/*=========================================================
    CELEBRATION
=========================================================*/

function startCelebration(){

    createConfetti();

    createHearts();

    createCelebrationPetals();

    cake.style.transition = "all 2s ease";

    cake.style.transform = "translateY(-250px) scale(.35)";

    setTimeout(() => {

        cakeScene.classList.remove("active");

        cakeScene.classList.add("hidden");

        celebrationScene.classList.remove("hidden");

        celebrationScene.classList.add("active");

    }, 2200);

    // Let the celebration text spin + shrink first, then bring the
    // envelope in on a matching spin so it reads as one continuous
    // motion rather than two separate scenes cutting between each other.

    setTimeout(() => {

        document.querySelector(".celebration-text").classList.add("spinOut");

    }, 4300);

    setTimeout(() => {

        envelopeScene.classList.remove("hidden");

        envelopeScene.classList.add("active");

        spinInEnvelope();

    }, 4550);

    setTimeout(() => {

        celebrationScene.classList.remove("active");

        celebrationScene.classList.add("hidden");

        clearCelebrationDecor();

    }, 5350);

}

/*=========================================================
    Remove any hearts/petals still mid-animation so they can't
    float on top of later scenes (they're a fixed, page-wide
    overlay, so they'd otherwise render above everything).
=========================================================*/

function clearCelebrationDecor(){

    document.querySelector(".hearts").innerHTML = "";

    document.querySelector(".petals").innerHTML = "";

}

/*=========================================================
    CONFETTI
=========================================================*/

let confettiPieces = [];
let confettiAnimating = false;

function createConfetti(){

    const canvas = document.getElementById("confettiCanvas");

    resizeConfettiCanvas();

    confettiPieces = [];

    for (let i = 0; i < 180; i++){

        confettiPieces.push({

            x: Math.random() * canvas.width,

            y: -20,

            size: Math.random() * 8 + 4,

            speed: Math.random() * 6 + 4,

            drift: Math.random() * 2,

            color: `hsl(${Math.random() * 360},100%,60%)`

        });

    }

    if (!confettiAnimating){

        confettiAnimating = true;

        animateConfetti();

    }

}

function animateConfetti(){

    const canvas = document.getElementById("confettiCanvas");

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confettiPieces.forEach(p => {

        ctx.fillStyle = p.color;

        ctx.fillRect(p.x, p.y, p.size, p.size);

        p.y += p.speed;

        p.x += Math.sin(p.y / 25) * p.drift;

    });

    // stop once every piece has fallen off screen and the celebration
    // scene is no longer visible, to save CPU on later scenes

    const stillFalling = confettiPieces.some(p => p.y < canvas.height + 40);

    if (stillFalling || !celebrationScene.classList.contains("hidden")){

        requestAnimationFrame(animateConfetti);

    }

    else{

        confettiAnimating = false;

    }

}

function resizeConfettiCanvas(){

    const canvas = document.getElementById("confettiCanvas");

    if (!canvas) return;

    canvas.width = window.innerWidth;

    canvas.height = window.innerHeight;

}

/*=========================================================
    HEARTS
=========================================================*/

function createHearts(){

    const container = document.querySelector(".hearts");

    for (let i = 0; i < 8; i++){

        setTimeout(() => {

            const heart = document.createElement("div");

            heart.classList.add("heart");

            heart.style.left = Math.random() * 100 + "vw";

            heart.style.bottom = "-20px";

            heart.style.animationDuration = Math.random() * 4 + 5 + "s";

            container.appendChild(heart);

            setTimeout(() => {

                heart.remove();

            }, 9000);

        }, i * 180);

    }

}

/*=========================================================
    PETALS (celebration burst)
=========================================================*/

function createCelebrationPetals(){

    const container = document.querySelector(".petals");

    for (let i = 0; i < 70; i++){

        setTimeout(() => {

            const petal = document.createElement("div");

            petal.classList.add("petal");

            petal.style.left = Math.random() * 100 + "vw";

            const size = Math.random() * 12 + 12;

            petal.style.width = size + "px";

            petal.style.height = size * 1.5 + "px";

            petal.style.animationDuration = Math.random() * 5 + 7 + "s";

            container.appendChild(petal);

            setTimeout(() => {

                petal.remove();

            }, 12000);

        }, i * 120);

    }

}

/*=========================================================
    AMBIENT FAIRY LIGHTS (once, on load)
=========================================================*/

function createFairyLights(){

    const container = document.querySelector(".lights");

    const count = 26;

    for (let i = 0; i < count; i++){

        const light = document.createElement("div");

        light.classList.add("light");

        light.style.left = (Math.random() * 100) + "vw";

        light.style.top = (Math.random() * 18) + "vh";

        light.style.animationDelay = (Math.random() * 2) + "s";

        container.appendChild(light);

    }

}

/*=========================================================
    ENVELOPE
=========================================================*/

function spinInEnvelope(){

    envelope.classList.remove("spinIn");

    // force reflow so the animation can be re-triggered if this
    // ever runs more than once in a session

    void envelope.offsetWidth;

    envelope.classList.add("spinIn");

    const heading = document.querySelector(".envelopeContainer h2");

    heading.classList.remove("show");

    setTimeout(() => {

        heading.classList.add("show");

    }, 500);

}

function openEnvelope(){

    if (envelope.classList.contains("open")) return;

    envelope.classList.add("open");

    safePlay(whooshSound);

    setTimeout(() => {

        envelopeScene.classList.add("envelopeSceneLeaving");

    }, 950);

    setTimeout(() => {

        showBook();

    }, 1550);

}

function showBook(){

    envelopeScene.classList.remove("active");

    envelopeScene.classList.add("hidden");

    envelopeScene.classList.remove("envelopeSceneLeaving");

    bookScene.classList.remove("hidden");

    bookScene.classList.add("active", "bookEntering");

    cover.style.animation = "coverOpen 1.2s .45s forwards";

    setTimeout(() => {

        bookScene.classList.remove("bookEntering");

    }, 1200);

}

/*=========================================================
    BOOK PAGES
=========================================================*/

function displayPage(){

    pages.forEach((page, index) => {

        page.classList.toggle("active", index === currentPage);

    });

}

/*=========================================================
    PHOTO PLACEHOLDERS
    Loads each page image from data-src; if it 404s (because
    the user hasn't added their own photo yet), swap in a
    friendly placeholder instead of a broken image icon.
=========================================================*/

function setupPageImages(){

    document.querySelectorAll(".page img[data-src]").forEach(img => {

        const realSrc = img.getAttribute("data-src");

        img.addEventListener("error", () => {

            const placeholder = document.createElement("div");

            placeholder.className = "img-placeholder";

            placeholder.innerHTML =
                `<span class="icon">ðŸ–¼ï¸</span><span>Add a photo here â€” save it as<br><strong>${realSrc}</strong></span>`;

            img.replaceWith(placeholder);

        }, { once: true });

        img.src = realSrc;

    });

}





