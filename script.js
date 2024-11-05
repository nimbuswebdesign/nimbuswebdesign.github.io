const dynamicText = document.querySelector("h3 span");
const words = ["Web Design","Web Development","SEO","Backend Development"]

let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;


const typeEffect = () => {
    const currentWord = words[wordIndex];
    const currentChar = currentWord.substring(0, charIndex);
    dynamicText.textContent = currentChar;
    dynamicText.classList.add("stop-blinking");

    if(!isDeleting && charIndex < currentWord.length){
        //if condition is true, type next character
        charIndex++;
        setTimeout(typeEffect, 200);
    } else if(isDeleting && charIndex > 0){
        //if condition is true, remove the previous character
        charIndex--;
        setTimeout(typeEffect, 100);
    } else{
        //if word is deleted then switch to the next word
        isDeleting = !isDeleting;
        dynamicText.classList.remove("stop-blinking");
        wordIndex = !isDeleting ? (wordIndex + 1) % words.length : wordIndex;
        setTimeout(typeEffect, 1200)
    }
}

typeEffect();





//borgar
const navEl = document.querySelector('.nav');
const hamburgerEl = document.querySelector('.hamburger');


hamburgerEl.addEventListener('click', () => {
    navEl.classList.toggle("nav-open");
    hamburgerEl.classList.toggle('hamburger-open');
});

navEl.addEventListener('click', () => {
    navEl.classList.remove("nav-open");
    hamburgerEl.classList.remove("hamburger-open");
})