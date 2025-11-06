// --- FULLCALENDAR Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    // --- Elements & Variables ---
    const calendarEl = document.getElementById('calendar');
    
    // Elements for the modal form
    const modal = document.getElementById('event-modal');
    const closeBtn = document.querySelector('.close-btn');
    const form = document.getElementById('event-form');
    const formTitle = modal.querySelector('h2'); // To change "Add" to "Edit"
    
    const eventDateInput = document.getElementById('event-date');
    const eventTitleInput = document.getElementById('event-title-input');
    const eventDescriptionInput = document.getElementById('event-description-input');
    const saveButton = form.querySelector('button[type="submit"]');
    
    // New button for deleting an event
    const deleteButton = document.createElement('button');
    deleteButton.id = 'delete-event-btn';
    deleteButton.innerText = 'Delete Event';
    deleteButton.type = 'button'; // Prevent form submission
    form.appendChild(deleteButton); // Add the delete button to the form
    
    // Variable to hold the event object being edited (null if adding a new one)
    let currentEvent = null; 

    // --- Utility Functions ---
    function loadEvents() {
        const eventsJson = localStorage.getItem('calendarEvents');
        return eventsJson ? JSON.parse(eventsJson) : [];
    }

    function saveEvents(events) {
        localStorage.setItem('calendarEvents', JSON.stringify(events));
    }
    
    // Load initial events
    let initialEvents = loadEvents();

    // --- FullCalendar Configuration ---
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: initialEvents,
        
        // --- 1. Date Click (Adding an event) ---
        dateClick: function(info) {
            // Set for ADD mode
            currentEvent = null;
            formTitle.innerText = "Add New Event";
            saveButton.innerText = "Save Event";
            deleteButton.style.display = 'none'; // Hide delete button

            // Clear inputs and set date
            eventDateInput.value = info.dateStr;
            eventTitleInput.value = '';
            eventDescriptionInput.value = '';

            modal.style.display = 'block';
        },
        
        // --- 2. Event Click (Editing/Deleting an event) ---
        eventClick: function(info) {
            // Set for EDIT mode
            currentEvent = info.event; // Store the FullCalendar Event object
            formTitle.innerText = "Edit Event";
            saveButton.innerText = "Update Event";
            deleteButton.style.display = 'block'; // Show delete button

            // Pre-fill the form with event details
            // The startStr gives us the date in YYYY-MM-DD format
            eventDateInput.value = info.event.startStr; 
            eventTitleInput.value = info.event.title;
            // FullCalendar stores custom data in 'extendedProps'
            eventDescriptionInput.value = info.event.extendedProps.description || ''; 

            modal.style.display = 'block';
        },
        
        // Interactivity: Drag-and-Drop (Optional but useful for editing)
        editable: true, 
        eventDrop: function(info) {
            // Fired when an event is dragged to a new date
            handleEventSave(info.event);
        }
    });

    calendar.render();

    // --- Core Save/Update Logic ---
    function handleEventSave(eventObj) {
        let savedEvents = loadEvents();
        
        // Find the index of the old event in local storage using its ID/title/start as a key
        // Note: FullCalendar IDs are better for this, but we'll use title/start as IDs are not auto-set for local events.
        const eventDateKey = eventObj.startStr || eventDateInput.value;
        
        // To simplify, we'll recreate the whole local storage array from the FullCalendar events
        const calendarEvents = calendar.getEvents().map(event => ({
            title: event.title,
            start: event.startStr,
            allDay: true,
            extendedProps: {
                description: event.extendedProps.description
            }
        }));
        
        saveEvents(calendarEvents);
    }
    
    // --- Event Form Submission (Add or Edit) ---
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const date = eventDateInput.value;
        const title = eventTitleInput.value.trim();
        const description = eventDescriptionInput.value.trim();

        if (!title) {
            alert('Event title is required!');
            return;
        }

        const newEventData = {
            title: title,
            start: date,
            allDay: true,
            extendedProps: {
                description: description
            }
        };

        if (currentEvent) {
            // --- EDIT LOGIC ---
            currentEvent.setProp('title', title);
            currentEvent.setExtendedProp('description', description);
            currentEvent.setStart(date);
            
        } else {
            // --- ADD LOGIC ---
            calendar.addEvent(newEventData);
        }
        
        // Update local storage for persistence
        handleEventSave(currentEvent || calendar.getEvents().find(e => e.startStr === date && e.title === title));

        // Close modal and reset state
        modal.style.display = 'none';
        form.reset();
        currentEvent = null;
    });
    
    // --- Delete Logic ---
    deleteButton.addEventListener('click', function() {
        if (currentEvent && confirm(`Are you sure you want to delete "${currentEvent.title}"?`)) {
            // 1. Remove from the calendar
            currentEvent.remove(); 
            
            // 2. Remove from local storage
            handleEventSave(); // Re-saves all events currently on the calendar

            // Close modal and reset state
            modal.style.display = 'none';
            currentEvent = null;
        }
    });

    // --- Modal Closing Logic ---
    closeBtn.onclick = function() {
        modal.style.display = 'none';
        currentEvent = null; // Clear event on close
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            currentEvent = null; // Clear event on close
        }
    }
});