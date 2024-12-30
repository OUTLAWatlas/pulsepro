document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('patientForm');
    const popup = document.getElementById('popup');
    const popupMessage = document.getElementById('popupMessage');
    const closePopupButton = document.getElementById('closePopup');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Get form values
        const name = document.getElementById('patient-name').value;
        const id = document.getElementById('patient-id').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        // Display the popup message
        popupMessage.textContent = "Graph has been sent to your doctor.";
        popup.style.display = 'block';
    });

    closePopupButton.addEventListener('click', function() {
        popup.style.display = 'none';
    });
});
