console.log("Let's write JavaScript");

let currentSong;
let songs = [];
let songsMeta = {};
let currentIndex = 0;
let currentFolder = "";

const play = document.querySelector(".play");
const prev = document.querySelector(".prev");
const next = document.querySelector(".next");
const volumeRange = document.querySelector(".volume-range");
const volumeIcon = document.querySelector(".volume-icon");
let currentVolume = volumeRange ? Number(volumeRange.value) / 100 : 0.5;
let isMuted = false;
let volumeBeforeMute = currentVolume;

const VOLUME_ICON = `
    <polygon points="5,9 9,9 14,5 14,19 9,15 5,15"/>
    <path d="M17 8 C18.5 9.5 18.5 14.5 17 16"
          stroke="white" stroke-width="2"
          fill="none" stroke-linecap="round"/>
    <path d="M19.5 5.5 C22.5 8.5 22.5 15.5 19.5 18.5"
          stroke="white" stroke-width="2"
          fill="none" stroke-linecap="round"/>
`;

const MUTE_ICON = `
    <polygon points="5,9 9,9 14,5 14,19 9,15 5,15"/>
    <line x1="17" y1="9" x2="21" y2="15"
          stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="21" y1="9" x2="17" y2="15"
          stroke="white" stroke-width="2" stroke-linecap="round"/>
`;

async function getsongs(folder) {
    let audioFiles = await fetch(`http://127.0.0.1:3000/songs/${folder}`);
    let response = await audioFiles.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    let songs = [];

    for (let i = 0; i < as.length; i++) {
        if (as[i].href.endsWith(".mp3")) {
            songs.push(as[i].href);
        }
    }

    return songs;
}

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updatePlayIcon(isPlaying) {
    if (isPlaying) {
        play.innerHTML = `
            <circle cx="12" cy="12" r="11" fill="#1DB954"/>
            <rect x="9" y="8" width="2.5" height="8" fill="black"/>
            <rect x="13" y="8" width="2.5" height="8" fill="black"/>
        `;
    } else {
        play.innerHTML = `
            <circle cx="12" cy="12" r="11" fill="#1DB954"/>
            <polygon points="10,8 17,12 10,16" fill="black"/>
        `;
    }
}

function playMusic(track, meta = null) {
    currentIndex = songs.indexOf(track);

    if (currentSong) {
        currentSong.pause();
    }

    if (!meta && songsMeta[track]) {
        meta = songsMeta[track];
    }

    currentSong = new Audio(track);
    currentSong.volume = isMuted ? 0 : currentVolume;
    currentSong.play();

    let songName = decodeURIComponent(track).split(/[/\\]/).pop().replace(".mp3", "");

    let displayTitle = meta?.title || songName;
    let coverUrl = meta?.coverUrl
        || (meta?.cover && currentFolder
            ? `http://127.0.0.1:3000/${currentFolder}/${meta.cover}`
            : null)
        || (currentFolder.startsWith("songs2/")
            ? `http://127.0.0.1:3000/${currentFolder}/cover.jpg`
            : `http://127.0.0.1:3000/songs/${currentFolder}/cover.jpg`);

    document.querySelector(".song-info").innerHTML = `
        <img src="${coverUrl}" 
             alt="cover" class="now-playing-cover">
        <span class="current-song">${displayTitle}</span>
    `;

    updatePlayIcon(true);

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            secondsToMinutesSeconds(currentSong.currentTime);
        document.querySelector(".songduration").innerHTML =
            secondsToMinutesSeconds(currentSong.duration);

        if (!isNaN(currentSong.duration)) {
            document.querySelector(".circle").style.left =
                (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    currentSong.addEventListener("ended", () => {
        currentIndex++;
        if (currentIndex < songs.length) {
            playMusic(songs[currentIndex]);
        }
    });
}

async function displayAlbums() {
    let album__container = document.querySelector(".album__container");

    let audioFiles = await fetch(`http://127.0.0.1:3000/songs/`);
    let response = await audioFiles.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = div.getElementsByTagName("a");

    Array.from(anchors).forEach(async e => {
        if (e.href.includes("%5Csongs")) {
            let decoded = decodeURIComponent(e.href);
            let folder = decoded.split("\\").pop();

            let as = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
            let data = await as.json();

            let albumDiv = document.createElement("div");
            albumDiv.dataset.folder = folder;
            albumDiv.classList.add("album");
            albumDiv.innerHTML = `
                <img src="http://127.0.0.1:3000/songs/${folder}/cover.jpg" alt="">
                <p>${data.title}</p>
                <span>${data.description}</span>
            `;

            albumDiv.addEventListener("click", async () => {
                currentFolder = folder;
                songs = await getsongs(folder);
                songsMeta = {};
                const albumCover = `http://127.0.0.1:3000/songs/${folder}/cover.jpg`;
                songs.forEach(songUrl => {
                    songsMeta[songUrl] = { 
                        coverUrl: albumCover,
                        title: decodeURIComponent(songUrl).split(/[/\\]/).pop().replace(".mp3", ""),
                        artist: data.title
                    };
                });
                displayPlaylist();
            });

            album__container.appendChild(albumDiv);
        }
    });
}

function displayPlaylist() {
    let songlist = document.querySelector(".playlist");
    songlist.innerHTML = "";

    for (const song of songs) {
        let songName = decodeURIComponent(song).split(/[/\\]/).pop().replace(".mp3", "");
        
        let meta = songsMeta[song] || {};
        let title = meta.title || songName;
        let artist = meta.artist || "Unknown Artist";
        let coverUrl = meta.coverUrl || "https://via.placeholder.com/45?text=Music";

        let item = document.createElement("div");
        item.classList.add("playlist1");
        
        item.innerHTML = `
            <img src="${coverUrl}" alt="${title}" class="playlist-cover" onerror="this.src='https://via.placeholder.com/45?text=Music'">
            <div class="playlist1__title">
                <p>${title}</p>
                <span>${artist}</span>
            </div>
        `;

        item.addEventListener("click", () => {
            playMusic(song, songsMeta[song]);
        });

        songlist.appendChild(item);
    }
}

async function displayCategoryMusic(category, containerId) {
    let container = document.getElementById(containerId);
    container.innerHTML = "";

    let folderPath = `songs2/${category}`;

    try {
        let response = await fetch(`http://127.0.0.1:3000/${folderPath}/`);
        let html = await response.text();

        let div = document.createElement("div");
        div.innerHTML = html;

        let anchors = div.getElementsByTagName("a");
        let trackFiles = [];

        for (let i = 0; i < anchors.length; i++) {
            let href = anchors[i].href;
            if (href.endsWith(".mp3")) {
                trackFiles.push(href);
            }
        }

        if (trackFiles.length === 0) {
            container.innerHTML = `<p style="color:#a0a0a0;padding:10px;">No tracks found in ${category}</p>`;
            return;
        }

        let metaMap = {};
        try {
            let metaRes = await fetch(`http://127.0.0.1:3000/${folderPath}/info.json`);
            if (metaRes.ok) {
                let data = await metaRes.json();
                if (Array.isArray(data.tracks)) {
                    data.tracks.forEach(t => {
                        metaMap[t.file] = t;
                    });
                }
            }
        } catch (e) {
            console.warn(`No info.json for ${category}`, e);
        }

        for (const trackUrl of trackFiles) {
            let fileName = decodeURIComponent(trackUrl).split(/[/\\]/).pop(); 

            let meta = metaMap[fileName] || {
                title: fileName.replace(".mp3", ""),
                artist: "Unknown Artist",
                cover: "cover.jpg"
            };

            const coverUrl = `http://127.0.0.1:3000/${folderPath}/${meta.cover}`;

            let card = document.createElement("div");
            card.classList.add("music__card");
            card.innerHTML = `
                <img src="${coverUrl}" alt="${meta.title}">
                <p>${meta.title}</p>
                <span>${meta.artist}</span>
            `;

            card.addEventListener("click", () => {
                songs = trackFiles;
                currentFolder = folderPath;
                songsMeta = {};
                trackFiles.forEach(url => {
                    const name = decodeURIComponent(url).split(/[/\\]/).pop();
                    const trackMeta = metaMap[name] || meta;
                    songsMeta[url] = {
                        title: trackMeta.title,
                        artist: trackMeta.artist,
                        coverUrl: `http://127.0.0.1:3000/${folderPath}/${trackMeta.cover}`
                    };
                });
                playMusic(trackUrl, songsMeta[trackUrl]);
                displayPlaylist();
            });

            container.appendChild(card);
        }

    } catch (err) {
        console.error(`Failed to load ${category}:`, err);
        container.innerHTML = `<p style="color:#a0a0a0;padding:10px;">Could not load ${category}</p>`;
    }
}

async function loadAllCategories() {
    await displayCategoryMusic("lofi", "lofi");
    await displayCategoryMusic("rock", "rock");
    await displayCategoryMusic("podcast", "podcast");
}

function initScrollRows() {
    document.querySelectorAll(".scroll-row").forEach(row => {
        const container = row.querySelector(
            ".album__container, .music__container, .podcast__container"
        );
        const leftBtn = row.querySelector(".left-btn");
        const rightBtn = row.querySelector(".right-btn");

        if (!container || !leftBtn || !rightBtn) return;

        const updateButtons = () => {
            const maxScroll = container.scrollWidth - container.clientWidth;
            const hasOverflow = maxScroll > 1;

            leftBtn.classList.toggle("is-hidden", container.scrollLeft <= 0);
            rightBtn.classList.toggle(
                "is-hidden",
                !hasOverflow || container.scrollLeft >= maxScroll - 1
            );
        };

        leftBtn.addEventListener("click", () => {
            container.scrollBy({
                left: -container.clientWidth * 0.8,
                behavior: "smooth"
            });
        });

        rightBtn.addEventListener("click", () => {
            container.scrollBy({
                left: container.clientWidth * 0.8,
                behavior: "smooth"
            });
        });

        container.addEventListener("scroll", updateButtons, { passive: true });
        window.addEventListener("resize", updateButtons);
        new ResizeObserver(updateButtons).observe(container);

        updateButtons();
    });
}

const collapseBtn = document.getElementById('collapse-btn');
if(collapseBtn) {
    collapseBtn.addEventListener('click', () => {
        document.querySelector('.hero__left').classList.toggle('collapsed');
    });
}

function initCategoryNavigation() {
    const btnAll = document.querySelector('.all--button');
    const btnMusic = document.querySelector('.music--button');
    const btnPodcast = document.querySelector('.podcasts--button');

    const sectionAll = document.getElementById('section-all');
    const sectionMusic = document.getElementById('section-music');
    const sectionPodcast = document.getElementById('section-podcast');

    if (btnAll && sectionAll) {
        btnAll.addEventListener('click', () => {
            sectionAll.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (btnMusic && sectionMusic) {
        btnMusic.addEventListener('click', () => {
            sectionMusic.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (btnPodcast && sectionPodcast) {
        btnPodcast.addEventListener('click', () => {
            sectionPodcast.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

// --- Sticky Header Scroll Color Logic ---
function initStickyHeader() {
    const heroRight = document.getElementById('hero-right-container');
    const stickyNav = document.querySelector('.sticky-nav');
    
    if(heroRight && stickyNav) {
        heroRight.addEventListener('scroll', () => {
            // Apply blue background to the buttons header as soon as it begins scrolling
            if (heroRight.scrollTop > 20) {
                stickyNav.classList.add('scrolled');
            } else {
                stickyNav.classList.remove('scrolled');
            }
        });
    }
}

async function main() {
    displayAlbums();
    displayPlaylist();
    await loadAllCategories();
    initScrollRows();
    initCategoryNavigation();
    initStickyHeader(); 
}

play.addEventListener("click", () => {
    if (!currentSong) return;
    if (currentSong.paused) {
        currentSong.play();
        updatePlayIcon(true);
    } else {
        currentSong.pause();
        updatePlayIcon(false);
    }
});

prev.addEventListener("click", () => {
    if (currentIndex > 0) {
        currentIndex--;
        playMusic(songs[currentIndex]);
    }
});

next.addEventListener("click", () => {
    if (currentIndex < songs.length - 1) {
        currentIndex++;
        playMusic(songs[currentIndex]);
    }
});

const seekbar = document.querySelector(".seekbar");
const circle = document.querySelector(".circle");

let isDragging = false;

function updateSeekPosition(clientX) {
    if (!currentSong || isNaN(currentSong.duration)) return;

    const rect = seekbar.getBoundingClientRect();
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    circle.style.left = percent * 100 + "%";
    return percent;
}

seekbar.addEventListener("click", (e) => {
    const percent = updateSeekPosition(e.clientX);
    if (percent !== undefined) {
        currentSong.currentTime = percent * currentSong.duration;
    }
});

circle.addEventListener("mousedown", () => {
    isDragging = true;
});

document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    updateSeekPosition(e.clientX);
});

document.addEventListener("mouseup", (e) => {
    if (!isDragging || !currentSong) return;
    const percent = updateSeekPosition(e.clientX);
    if (percent !== undefined) {
        currentSong.currentTime = percent * currentSong.duration;
    }
    isDragging = false;
});

function updateVolumeIcon() {
    if (!volumeIcon) return;
    volumeIcon.innerHTML = isMuted ? MUTE_ICON : VOLUME_ICON;
}

function applyVolumeToAudio() {
    if (currentSong) {
        currentSong.volume = isMuted ? 0 : currentVolume;
    }
}

function setVolume(value) {
    currentVolume = Math.max(0, Math.min(1, value));

    if (currentVolume === 0) {
        isMuted = true;
    } else {
        isMuted = false;
        volumeBeforeMute = currentVolume;
    }

    if (volumeRange) {
        volumeRange.value = Math.round(currentVolume * 100);
    }

    updateVolumeIcon();
    applyVolumeToAudio();
}

function toggleMute() {
    if (isMuted) {
        isMuted = false;
        currentVolume = volumeBeforeMute > 0 ? volumeBeforeMute : 0.5;
        if (volumeRange) {
            volumeRange.value = Math.round(currentVolume * 100);
        }
    } else {
        volumeBeforeMute = currentVolume;
        isMuted = true;
    }

    updateVolumeIcon();
    applyVolumeToAudio();
}

if (volumeIcon) {
    volumeIcon.addEventListener("click", toggleMute);
}

if (volumeRange) {
    volumeRange.addEventListener("input", () => {
        setVolume(Number(volumeRange.value) / 100);
    });
}

main();
