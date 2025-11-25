
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.complete-btn');
    const total = buttons.length;
    let done = 0;

    const bar = document.getElementById('mainProgressBar');
    const text = document.getElementById('progressText');

    function update() {
      const percent = Math.round((done / total) * 100);
      bar.style.width = percent + '%';
      bar.textContent = percent + '%';
      text.textContent = `${done} of ${total} activities completed`;
    }

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.activity-card');
        const isDone = btn.textContent === 'Undo';

        if (isDone) {
          // undoes completion
          card.querySelectorAll('h4, p').forEach(el => {
            el.style.textDecoration = 'none';
            el.style.color = '';
          });
          btn.textContent = 'Mark as Done';
          done--;
        } else {
          // completes actvity
          card.querySelectorAll('h4, p').forEach(el => {
            el.style.textDecoration = 'line-through';
            el.style.color = '#888';
          });
          btn.textContent = 'Undo';
          done++;
        }
        update();
      });
    });

    update(); // initializes the progress
  });