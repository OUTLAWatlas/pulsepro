// doctor.js

// Function to handle booking button click
document.addEventListener("DOMContentLoaded", () => {
    const bookButtons = document.querySelectorAll(".bg-blue-500");

    bookButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            const doctorName = event.target.parentElement.querySelector("h2").textContent;
            alert(`Appointment booked with ${doctorName}`);
            // Redirect or handle booking process
            console.log(`Booking initiated for ${doctorName}`);
        });
    });
});

// Navigation link highlighting
const navLinks = document.querySelectorAll(".nav-right a");
navLinks.forEach((link) => {
    link.addEventListener("mouseover", () => {
        link.style.backgroundColor = "#ff858d";
        link.style.borderRadius = "20px";
    });

    link.addEventListener("mouseout", () => {
        link.style.backgroundColor = "transparent";
    });
});

// Responsive image handling placeholder
const doctorImages = document.querySelectorAll(".w-full.h-64.object-cover");
doctorImages.forEach((img) => {
    img.addEventListener("error", () => {
        img.src = "default-image.png"; // Replace with a valid fallback image URL
    });
});
