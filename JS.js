// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    const privacyPolicyLink = document.getElementById('privacyPolicyLink');
    
    // Show privacy policy modal when the link is clicked
    if (privacyPolicyLink) {
        privacyPolicyLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior
            $('#privacyPolicyModal').modal('show'); // Show the modal
        });
    }

    // Initialize IndexedDB for consultations
    let DB;
    const form = document.querySelector('form');
    const patientName = document.querySelector('#patient-name');
    const contact = document.querySelector('#contact');
    const date = document.querySelector('#date');
    const time = document.querySelector('#time');
    const symptoms = document.querySelector('#symptoms');
    const consultations = document.querySelector('#consultations');
    const services = document.querySelector('#services');

    // Create the database
    let ScheduleDB = window.indexedDB.open('consultations', 1);

    ScheduleDB.onerror = () => console.error('Error loading database');

    ScheduleDB.onsuccess = () => {
        DB = ScheduleDB.result;
        showConsultations();
    };

    ScheduleDB.onupgradeneeded = (e) => {
        let db = e.target.result;

        let objectStore = db.createObjectStore('consultations', { keyPath: 'key', autoIncrement: true });
        objectStore.createIndex('patientname', 'patientname', { unique: false });
        objectStore.createIndex('contact', 'contact', { unique: false });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('time', 'time', { unique: false });
        objectStore.createIndex('symptoms', 'symptoms', { unique: false });

        console.log('Database created and fields initialized!');
    };

    form.addEventListener('submit', addConsultation);

    function addConsultation(e) {
        e.preventDefault();

        let newConsultation = {
            patientname: patientName.value,
            contact: contact.value,
            date: date.value,
            time: time.value,
            symptoms: symptoms.value
        };

        let transaction = DB.transaction(['consultations'], 'readwrite');
        let objectStore = transaction.objectStore('consultations');

        let request = objectStore.add(newConsultation);
        request.onsuccess = () => form.reset();
        transaction.oncomplete = () => showConsultations();
        transaction.onerror = () => console.error('Error adding consultation');
    }

    function showConsultations() {
        consultations.innerHTML = '';

        let objectStore = DB.transaction('consultations').objectStore('consultations');

        objectStore.openCursor().onsuccess = function (e) {
            let cursor = e.target.result;

            if (cursor) {
                let consultationHTML = document.createElement('li');
                consultationHTML.setAttribute('data-consultation-id', cursor.value.key);
                consultationHTML.classList.add('list-group-item');

                consultationHTML.innerHTML = `
                    <p class="font-weight-bold">Patient Name: <span class="font-weight-normal">${cursor.value.patientname}</span></p>
                    <p class="font-weight-bold">Contact: <span class="font-weight-normal">${cursor.value.contact}</span></p>
                    <p class="font-weight-bold">Date: <span class="font-weight-normal">${cursor.value.date}</span></p>
                    <p class="font-weight-bold">Time: <span class="font-weight-normal">${cursor.value.time}</span></p>
                    <p class="font-weight-bold">Symptoms: <span class="font-weight-normal">${cursor.value.symptoms}</span></p>
                `;

                // Add cancel button
                const cancelBtn = document.createElement('button');
                cancelBtn.classList.add('btn', 'btn-danger');
                cancelBtn.innerHTML = 'Cancel';
                cancelBtn.onclick = removeConsultation;

                consultationHTML.appendChild(cancelBtn);
                consultations.appendChild(consultationHTML);

                cursor.continue();
            } else {
                if (!consultations.firstChild) {
                    services.textContent = 'Change your visiting hours';
                    const noSchedule = document.createElement('p');
                    noSchedule.classList.add('text-center');
                    noSchedule.textContent = 'No results found';
                    consultations.appendChild(noSchedule);
                } else {
                    services.textContent = 'Cancel Your Consultations';
                }
            }
        };
    }

    function removeConsultation(e) {
        let consultationID = Number(e.target.parentElement.getAttribute('data-consultation-id'));

        let transaction = DB.transaction(['consultations'], 'readwrite');
        let objectStore = transaction.objectStore('consultations');

        objectStore.delete(consultationID);

        transaction.oncomplete = () => {
            e.target.parentElement.remove();

            if (!consultations.firstChild) {
                services.textContent = 'Change your visiting hours';
                const noSchedule = document.createElement('p');
                noSchedule.classList.add('text-center');
                noSchedule.textContent = 'No results found';
                consultations.appendChild(noSchedule);
            } else {
                services.textContent = 'Cancel Your Consultation';
            }
        };
    }
});
