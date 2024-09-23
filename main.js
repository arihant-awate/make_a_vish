document.addEventListener('DOMContentLoaded', function() {
    const screen1 = document.getElementById('screen1');
    const screen2 = document.getElementById('screen2');
    const bgMusic = document.getElementById('bgMusic');
    const popSound = document.getElementById('popSound');
    let musicStarted = false;

    // Move to the next screen and start music when space is pressed on the first screen
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
            if (!musicStarted && screen1.style.display !== 'none') {
                bgMusic.play();
                musicStarted = true;
                screen1.style.display = 'none';
                screen2.style.display = 'flex';
            } else if (screen2.style.display !== 'none') {
                bgMusic.play(); // Ensure music plays if it wasn't already playing
            }
        }
    });

    // Play pop sound when hovering over buttons on the second screen
    const ogButton = document.getElementById('ogButton');
    const goButton = document.getElementById('goButton');

    ogButton.addEventListener('click', function() {
        window.location.href = 'og_screen.html'; // Navigate to og_screen.html
    });

    goButton.addEventListener('click', function() {
        window.location.href = 'go_screen.html'; // Navigate to go_screen.html
    });

    ogButton.addEventListener('mouseover', function() {
        popSound.play();
    });

    goButton.addEventListener('mouseover', function() {
        popSound.play();
    });
});
