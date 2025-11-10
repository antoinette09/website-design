// --- initiating fullcalendar ---
document.addEventListener('DOMContentLoaded', function() {
    // --- elements and variables ---
    const calendarEl = document.getElementById('calendar');
    
    // elements
    const modal = document.getElementById('event-modal');
    const closeBtn = document.querySelector('.close-btn');
    const form = document.getElementById('event-form');
    const formTitle = modal.querySelector('h2'); // adding or editing events
    
    const eventDateInput = document.getElementById('event-date');
    const eventTitleInput = document.getElementById('event-title-input');
    const eventDescriptionInput = document.getElementById('event-description-input');
    const saveButton = form.querySelector('button[type="submit"]');
    
    // button that deletes an event
    const deleteButton = document.createElement('button');
    deleteButton.id = 'delete-event-btn';
    deleteButton.innerText = 'Delete Event';
    deleteButton.type = 'button'; // prevents it to be changed
    form.appendChild(deleteButton); // adds the delete button to the form
    
    // variable that holds the event object being edited
    let currentEvent = null; 

    // --- functions to load and save events ---
    function loadEvents() {
        const eventsJson = localStorage.getItem('calendarEvents');
        return eventsJson ? JSON.parse(eventsJson) : [];
    }

    function saveEvents(events) {
        localStorage.setItem('calendarEvents', JSON.stringify(events));
    }
    
    // loads initial events
    let initialEvents = loadEvents();

    // --- configuring fullcalendar ---
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: initialEvents,
        
        // --- adding an event ---
        dateClick: function(info) {
            // adding
            currentEvent = null;
            formTitle.innerText = "Add New Event";
            saveButton.innerText = "Save Event";
            deleteButton.style.display = 'none'; // hides the delete button

            // clears inputs and sets the date
            eventDateInput.value = info.dateStr;
            eventTitleInput.value = '';
            eventDescriptionInput.value = '';

            modal.style.display = 'block';
        },
        
        // --- editing and deleting ---
        eventClick: function(info) {
            // sets edit mode
            currentEvent = info.event; // stores the event
            formTitle.innerText = "Edit Event";
            saveButton.innerText = "Update Event";
            deleteButton.style.display = 'block'; // shows the delete button

            // fills the form with event details
            // gives the date in YYYY-MM-DD format
            eventDateInput.value = info.event.startStr; 
            eventTitleInput.value = info.event.title;
            // stores custom data
            eventDescriptionInput.value = info.event.extendedProps.description || ''; 

            modal.style.display = 'block';
        },
        
        // drag and drop for editing
        editable: true, 
        eventDrop: function(info) {
            // for when an event is dragged to a new date
            handleEventSave(info.event);
        }
    });

    calendar.render();

    // --- saving/upating ---
    function handleEventSave(eventObj) {
        let savedEvents = loadEvents();
        
        // finds the index of the old event in local storage using its title as a key
        const eventDateKey = eventObj.startStr || eventDateInput.value;
        
        // recreates the local storage array
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
    
    // --- submitting events ---
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
            end: date,
            allDay: false,
            extendedProps: {
                description: description
            }
        };

        if (currentEvent) {
            // --- editing ---
            currentEvent.setProp('title', title);
            currentEvent.setExtendedProp('description', description);
            currentEvent.setStart(date);
            
        } else {
            // --- adding ---
            calendar.addEvent(newEventData);
        }
        
        // updates local storage
        handleEventSave(currentEvent || calendar.getEvents().find(e => e.startStr === date && e.title === title));

        // resets state
        modal.style.display = 'none';
        form.reset();
        currentEvent = null;
    });
    
    // --- deleting ---
    deleteButton.addEventListener('click', function() {
        if (currentEvent && confirm(`Are you sure you want to delete "${currentEvent.title}"?`)) {
            // removes from the calendar
            currentEvent.remove(); 
            
            // removes from local storage
            handleEventSave(); // resaves all events currently on the calendar

            // resets state
            modal.style.display = 'none';
            currentEvent = null;
        }
    });

    // --- closing ---
    closeBtn.onclick = function() {
        modal.style.display = 'none';
        currentEvent = null; // clears event on close
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            currentEvent = null; // clears event on close
        }
    }
});